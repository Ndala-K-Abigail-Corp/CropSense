"""
Simple in-memory cache for query results
"""

import hashlib
import json
import time
from typing import Any, Dict, Optional
from collections import OrderedDict


class QueryCache:
    """
    Simple in-memory LRU cache for frequent queries
    
    Features:
    - LRU eviction policy
    - TTL (time-to-live) support
    - Query normalization for better hit rates
    """

    def __init__(self, maxsize: int = 100, ttl_seconds: int = 3600):
        """
        Initialize cache
        
        Args:
            maxsize: Maximum number of cached queries
            ttl_seconds: Time-to-live for cached entries (default 1 hour)
        """
        self.cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self.maxsize = maxsize
        self.ttl_seconds = ttl_seconds
        self.hits = 0
        self.misses = 0

    def _normalize_query(self, query: str) -> str:
        """Normalize query for better cache hits"""
        # Convert to lowercase and strip whitespace
        return query.lower().strip()

    def _hash_key(self, query: str, filters: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate cache key from query and filters
        
        Args:
            query: Query text
            filters: Optional metadata filters
            
        Returns:
            MD5 hash of normalized query + filters
        """
        normalized_query = self._normalize_query(query)
        filter_str = json.dumps(filters or {}, sort_keys=True)
        key = f"{normalized_query}:{filter_str}"
        return hashlib.md5(key.encode()).hexdigest()

    def get(
        self, query: str, filters: Optional[Dict[str, Any]] = None
    ) -> Optional[Any]:
        """
        Get cached result
        
        Args:
            query: Query text
            filters: Optional metadata filters
            
        Returns:
            Cached result or None if not found/expired
        """
        key = self._hash_key(query, filters)

        if key not in self.cache:
            self.misses += 1
            return None

        entry = self.cache[key]

        # Check if entry has expired
        if time.time() - entry["timestamp"] > self.ttl_seconds:
            del self.cache[key]
            self.misses += 1
            return None

        # Move to end (most recently used)
        self.cache.move_to_end(key)
        self.hits += 1
        return entry["result"]

    def set(
        self, query: str, result: Any, filters: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Cache a result
        
        Args:
            query: Query text
            result: Result to cache
            filters: Optional metadata filters
        """
        key = self._hash_key(query, filters)

        # Remove oldest entry if cache is full
        if len(self.cache) >= self.maxsize and key not in self.cache:
            self.cache.popitem(last=False)  # Remove oldest (FIFO)

        self.cache[key] = {"result": result, "timestamp": time.time()}
        self.cache.move_to_end(key)

    def clear(self) -> None:
        """Clear all cached entries"""
        self.cache.clear()
        self.hits = 0
        self.misses = 0

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache stats
        """
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "size": len(self.cache),
            "maxsize": self.maxsize,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(hit_rate, 2),
            "ttl_seconds": self.ttl_seconds,
        }


# Global cache instance
query_cache = QueryCache(maxsize=100, ttl_seconds=3600)


