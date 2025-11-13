"""
Test script to verify Gemini integration with RAG fallback
Tests both scenarios:
1. Query with good RAG results (uses RAG + Gemini)
2. Query with no/poor RAG results (falls back to direct Gemini)
"""

import asyncio
import json
from retriever import retriever_service
from gemini_service import gemini_service
from config import settings
from logger import logger


async def test_rag_retrieval():
    """Test RAG retrieval with existing chunks"""
    logger.info("=" * 80)
    logger.info("Test 1: RAG Retrieval")
    logger.info("=" * 80)
    
    query = "How do I prevent tomato blight?"
    logger.info(f"Query: {query}")
    
    try:
        results = await retriever_service.retrieve(query, top_k=3)
        
        logger.info(f"\nRetrieved {len(results)} chunks:")
        for i, result in enumerate(results, 1):
            logger.info(f"\n  [{i}] Score: {result['score']:.3f}")
            logger.info(f"      Source: {result['metadata'].get('source', 'N/A')}")
            logger.info(f"      Content: {result['content'][:150]}...")
        
        if results and results[0]['score'] >= settings.gemini_fallback_threshold:
            logger.info(f"\n✓ Good RAG results (score >= {settings.gemini_fallback_threshold})")
            logger.info("  → Would use Gemini WITH RAG context")
        else:
            logger.info(f"\n⚠ Poor RAG results (score < {settings.gemini_fallback_threshold})")
            logger.info("  → Would fallback to direct Gemini")
        
        return results
        
    except Exception as e:
        logger.error(f"Error in RAG retrieval: {e}")
        return []


async def test_gemini_with_rag():
    """Test Gemini answer generation WITH RAG context"""
    logger.info("\n" + "=" * 80)
    logger.info("Test 2: Gemini WITH RAG Context")
    logger.info("=" * 80)
    
    query = "How do I prevent tomato diseases?"
    logger.info(f"Query: {query}")
    
    try:
        # Get RAG context
        results = await retriever_service.retrieve(query, top_k=3)
        
        if results:
            context = retriever_service.build_context(results)
            logger.info(f"\nRAG context length: {len(context)} chars")
            logger.info(f"Using {len(results)} chunks")
        else:
            context = None
            logger.info("\nNo RAG context available")
        
        # Generate answer
        result = await gemini_service.generate_answer(
            query=query,
            context=context,
            user_id="test_user"
        )
        
        logger.info(f"\nSource: {result['source']}")
        logger.info(f"Cached: {result.get('cached', False)}")
        if result.get('generation_time_ms'):
            logger.info(f"Generation time: {result['generation_time_ms']:.0f}ms")
        
        logger.info(f"\nAnswer:\n{result['answer'][:500]}...")
        
        if result['source'] == 'gemini_with_rag':
            logger.info("\n✓ Successfully used Gemini WITH RAG context")
        elif result['source'] == 'cache':
            logger.info("\n✓ Retrieved from cache")
        else:
            logger.info(f"\n⚠ Unexpected source: {result['source']}")
        
    except Exception as e:
        logger.error(f"Error testing Gemini with RAG: {e}")


async def test_gemini_direct():
    """Test Gemini direct answer (no RAG context)"""
    logger.info("\n" + "=" * 80)
    logger.info("Test 3: Gemini Direct (No RAG)")
    logger.info("=" * 80)
    
    # Use a query that won't match RAG documents
    query = "What is quantum computing?"
    logger.info(f"Query: {query}")
    
    try:
        # Generate answer without RAG context
        result = await gemini_service.generate_answer(
            query=query,
            context=None,
            user_id="test_user",
            use_cache=False  # Don't cache test queries
        )
        
        logger.info(f"\nSource: {result['source']}")
        logger.info(f"Generation time: {result.get('generation_time_ms', 0):.0f}ms")
        
        logger.info(f"\nAnswer:\n{result['answer'][:500]}...")
        
        if result['source'] == 'gemini_direct':
            logger.info("\n✓ Successfully used direct Gemini (fallback)")
        else:
            logger.info(f"\n⚠ Unexpected source: {result['source']}")
        
    except Exception as e:
        logger.error(f"Error testing direct Gemini: {e}")


async def test_gemini_status():
    """Check Gemini configuration and availability"""
    logger.info("\n" + "=" * 80)
    logger.info("Test 4: Gemini Configuration")
    logger.info("=" * 80)
    
    logger.info(f"Enabled: {settings.gemini_enabled}")
    logger.info(f"Model: {settings.generation_model}")
    logger.info(f"Project: {settings.google_cloud_project}")
    logger.info(f"Location: {settings.vertex_ai_location}")
    logger.info(f"Fallback threshold: {settings.gemini_fallback_threshold}")
    logger.info(f"Max requests/hour: {settings.gemini_max_requests_per_hour}")
    
    if settings.gemini_enabled:
        logger.info("\n✓ Gemini is ENABLED and configured")
    else:
        logger.info("\n✗ Gemini is DISABLED")


async def main():
    """Run all tests"""
    logger.info("\n" + "=" * 80)
    logger.info("GEMINI INTEGRATION TEST SUITE")
    logger.info("=" * 80)
    
    # Test configuration
    await test_gemini_status()
    
    if not settings.gemini_enabled:
        logger.info("\n⚠ Gemini is disabled. Enable it in .env to run tests.")
        return
    
    # Test RAG retrieval
    await test_rag_retrieval()
    
    # Test Gemini with RAG
    await test_gemini_with_rag()
    
    # Test Gemini direct
    await test_gemini_direct()
    
    logger.info("\n" + "=" * 80)
    logger.info("ALL TESTS COMPLETE")
    logger.info("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())


