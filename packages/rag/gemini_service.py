"""
Gemini API integration for question answering with RAG fallback
"""

import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from google.cloud import firestore
import vertexai
from vertexai.generative_models import GenerativeModel, SafetySetting, GenerationConfig
from config import settings
from logger import logger


class GeminiService:
    """Service for Gemini-powered question answering with caching and rate limiting"""
    
    def __init__(self):
        """Initialize Gemini API client"""
        vertexai.init(
            project=settings.google_cloud_project,
            location=settings.vertex_ai_location
        )
        self.model_name = settings.generation_model
        self._model = None
        self.db = firestore.Client(
            project=settings.google_cloud_project,
            database=settings.firestore_database
        )
        self.cache_collection = "gemini_cache"
        self.rate_limit_collection = "gemini_rate_limits"
        
        # Default generation config
        self.generation_config = GenerationConfig(
            temperature=0.7,
            top_p=0.8,
            top_k=40,
            max_output_tokens=2048,
        )
        
        # Safety settings
        self.safety_settings = [
            SafetySetting(
                category=SafetySetting.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            ),
            SafetySetting(
                category=SafetySetting.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            ),
            SafetySetting(
                category=SafetySetting.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            ),
            SafetySetting(
                category=SafetySetting.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=SafetySetting.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            ),
        ]
    
    def _get_model(self) -> GenerativeModel:
        """Lazy load the Gemini model"""
        if self._model is None:
            self._model = GenerativeModel(
                self.model_name,
                generation_config=self.generation_config,
                safety_settings=self.safety_settings
            )
        return self._model
    
    async def check_rate_limit(self, user_id: Optional[str] = None) -> bool:
        """
        Check if request is within rate limits
        
        Args:
            user_id: User identifier (None for system/anonymous)
            
        Returns:
            True if within limits, False if rate limited
        """
        try:
            # Use "system" for anonymous requests
            uid = user_id or "system"
            
            rate_limit_ref = self.db.collection(self.rate_limit_collection).document(uid)
            doc = rate_limit_ref.get()
            
            now = datetime.now()
            current_hour = int(now.timestamp() // 3600)
            
            if not doc.exists:
                # First request, create document
                rate_limit_ref.set({
                    "userId": uid,
                    "requestsThisHour": 1,
                    "currentHour": current_hour,
                    "totalRequests": 1,
                    "firstRequestAt": firestore.SERVER_TIMESTAMP,
                    "lastRequestAt": firestore.SERVER_TIMESTAMP
                })
                return True
            
            data = doc.to_dict()
            requests_this_hour = data.get("requestsThisHour", 0)
            last_hour = data.get("currentHour", 0)
            
            # Check if new hour
            if current_hour != last_hour:
                # Reset counter for new hour
                rate_limit_ref.update({
                    "requestsThisHour": 1,
                    "currentHour": current_hour,
                    "totalRequests": firestore.Increment(1),
                    "lastRequestAt": firestore.SERVER_TIMESTAMP
                })
                return True
            
            # Check rate limit (e.g., 60 requests per hour)
            max_requests_per_hour = getattr(settings, 'gemini_max_requests_per_hour', 60)
            
            if requests_this_hour >= max_requests_per_hour:
                logger.warning(f"Rate limit exceeded for user {uid}")
                return False
            
            # Increment counter
            rate_limit_ref.update({
                "requestsThisHour": firestore.Increment(1),
                "totalRequests": firestore.Increment(1),
                "lastRequestAt": firestore.SERVER_TIMESTAMP
            })
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            # On error, allow request (fail open)
            return True
    
    async def get_cached_response(self, query: str) -> Optional[str]:
        """
        Get cached response for query
        
        Args:
            query: User query
            
        Returns:
            Cached response or None
        """
        try:
            # Use query as cache key (normalize first)
            cache_key = query.lower().strip()
            cache_ref = self.db.collection(self.cache_collection).document(cache_key)
            doc = cache_ref.get()
            
            if not doc.exists:
                return None
            
            data = doc.to_dict()
            
            # Check if cache is still valid (e.g., 24 hours)
            cache_ttl_hours = getattr(settings, 'gemini_cache_ttl_hours', 24)
            cached_at = data.get("cachedAt")
            
            if cached_at:
                # Firestore Timestamp to datetime
                if hasattr(cached_at, 'seconds'):
                    cached_datetime = datetime.fromtimestamp(cached_at.seconds)
                else:
                    cached_datetime = cached_at
                
                age = datetime.now() - cached_datetime
                if age > timedelta(hours=cache_ttl_hours):
                    logger.info("Cache expired")
                    return None
            
            logger.info("Cache hit for Gemini query")
            return data.get("response")
            
        except Exception as e:
            logger.error(f"Error getting cached response: {e}")
            return None
    
    async def cache_response(self, query: str, response: str) -> None:
        """
        Cache response for future queries
        
        Args:
            query: User query
            response: Generated response
        """
        try:
            cache_key = query.lower().strip()
            cache_ref = self.db.collection(self.cache_collection).document(cache_key)
            
            cache_ref.set({
                "query": query,
                "response": response,
                "cachedAt": firestore.SERVER_TIMESTAMP,
                "hitCount": firestore.Increment(1)
            }, merge=True)
            
            logger.info("Response cached")
            
        except Exception as e:
            logger.error(f"Error caching response: {e}")
    
    async def generate_answer(
        self,
        query: str,
        context: Optional[str] = None,
        user_id: Optional[str] = None,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Generate answer using Gemini with optional RAG context
        
        Args:
            query: User question
            context: Optional RAG context from retrieval
            user_id: User identifier for rate limiting
            use_cache: Whether to use cached responses
            
        Returns:
            Dict with 'answer', 'source', and metadata
        """
        start_time = time.time()
        
        try:
            # Check rate limit
            within_limit = await self.check_rate_limit(user_id)
            if not within_limit:
                return {
                    "answer": "Rate limit exceeded. Please try again in a few minutes.",
                    "source": "rate_limit",
                    "error": "RATE_LIMIT_EXCEEDED"
                }
            
            # Check cache
            if use_cache:
                cached_response = await self.get_cached_response(query)
                if cached_response:
                    return {
                        "answer": cached_response,
                        "source": "cache",
                        "cached": True,
                        "generation_time_ms": 0
                    }
            
            # Build prompt
            if context:
                prompt = self._build_rag_prompt(query, context)
                source = "gemini_with_rag"
            else:
                prompt = self._build_direct_prompt(query)
                source = "gemini_direct"
            
            # Generate response
            model = self._get_model()
            
            logger.info(f"Generating answer with Gemini ({source})")
            response = model.generate_content(prompt)
            
            # Extract text from response
            if hasattr(response, 'text'):
                answer = response.text
            elif hasattr(response, 'candidates') and len(response.candidates) > 0:
                answer = response.candidates[0].content.parts[0].text
            else:
                raise ValueError("Could not extract text from Gemini response")
            
            generation_time = (time.time() - start_time) * 1000
            
            # Cache response
            if use_cache:
                await self.cache_response(query, answer)
            
            logger.info(f"Generated answer in {generation_time:.0f}ms")
            
            return {
                "answer": answer,
                "source": source,
                "cached": False,
                "generation_time_ms": generation_time
            }
            
        except Exception as e:
            logger.error(f"Error generating answer with Gemini: {e}")
            return {
                "answer": "I'm having trouble generating a response right now. Please try again.",
                "source": "error",
                "error": str(e)
            }
    
    def _build_rag_prompt(self, query: str, context: str) -> str:
        """
        Build prompt with RAG context
        
        Args:
            query: User question
            context: Retrieved context from vector store
            
        Returns:
            Formatted prompt
        """
        prompt = f"""You are an expert agricultural advisor helping farmers with their questions. 
Use the following retrieved information from agricultural documents to answer the question accurately and helpfully.

Context from agricultural knowledge base:
{context}

Question: {query}

Instructions:
- Provide a clear, practical answer based on the context above
- If the context doesn't contain relevant information, say so honestly
- Focus on actionable advice that farmers can implement
- Use simple, clear language
- Cite specific sources when mentioning information

Answer:"""
        
        return prompt
    
    def _build_direct_prompt(self, query: str) -> str:
        """
        Build prompt for direct question (no RAG context)
        
        Args:
            query: User question
            
        Returns:
            Formatted prompt
        """
        prompt = f"""You are an expert agricultural advisor helping farmers with their questions about farming, crop management, pest control, and sustainable agriculture.

Question: {query}

Instructions:
- Provide accurate, practical advice based on general agricultural knowledge
- Focus on actionable guidance that farmers can implement
- Use simple, clear language
- If you're uncertain about specific details, acknowledge the limitations
- Recommend consulting local agricultural extension services for region-specific advice

Answer:"""
        
        return prompt


# Singleton instance
gemini_service = GeminiService()

