"""
Status Report Script - Shows current state of CropSense RAG system

Displays:
- Documents in vectorChunks (processed)
- Documents in farming_knowledge collection
- Documents in GCS bucket (if configured)
- Processing status
- Gemini configuration status
"""

import asyncio
from typing import Dict, Set
from google.cloud import firestore, storage
from config import settings
from logger import logger


class StatusReporter:
    """Generate comprehensive status report"""
    
    def __init__(self):
        self.db = firestore.Client(
            project=settings.google_cloud_project,
            database=settings.firestore_database
        )
    
    async def get_vectorchunks_status(self) -> Dict:
        """Get status of vectorChunks collection"""
        try:
            chunks = self.db.collection(settings.vector_collection).stream()
            
            # Count chunks and unique documents
            document_ids = set()
            chunk_count = 0
            
            for chunk in chunks:
                chunk_count += 1
                data = chunk.to_dict()
                metadata = data.get("metadata", {})
                doc_id = metadata.get("documentId")
                if doc_id:
                    document_ids.add(doc_id)
            
            return {
                "total_chunks": chunk_count,
                "unique_documents": len(document_ids),
                "document_ids": sorted(list(document_ids))
            }
        except Exception as e:
            return {"error": str(e)}
    
    async def get_farming_knowledge_status(self) -> Dict:
        """Get status of farming_knowledge collection"""
        try:
            docs = list(self.db.collection('farming_knowledge').stream())
            
            doc_ids = []
            for doc in docs:
                doc_ids.append(doc.id)
            
            return {
                "total_documents": len(docs),
                "document_ids": sorted(doc_ids)
            }
        except Exception as e:
            return {"error": str(e)}
    
    async def get_document_status_collection(self) -> Dict:
        """Get processing status tracking"""
        try:
            statuses = list(self.db.collection('document_status').stream())
            
            status_counts = {
                "completed": 0,
                "processing": 0,
                "failed": 0,
                "pending": 0
            }
            
            docs_by_status = {
                "completed": [],
                "processing": [],
                "failed": [],
                "pending": []
            }
            
            for status_doc in statuses:
                data = status_doc.to_dict()
                status = data.get("status", "unknown")
                if status in status_counts:
                    status_counts[status] += 1
                    docs_by_status[status].append(status_doc.id)
            
            return {
                "total_tracked": len(statuses),
                "status_counts": status_counts,
                "docs_by_status": docs_by_status
            }
        except Exception as e:
            return {"error": str(e)}
    
    def get_gemini_status(self) -> Dict:
        """Get Gemini configuration status"""
        return {
            "enabled": settings.gemini_enabled,
            "model": settings.generation_model,
            "max_requests_per_hour": settings.gemini_max_requests_per_hour,
            "fallback_threshold": settings.gemini_fallback_threshold,
            "cache_ttl_hours": settings.gemini_cache_ttl_hours
        }
    
    def get_embedding_config(self) -> Dict:
        """Get embedding configuration"""
        return {
            "model": settings.embedding_model,
            "dimension": settings.embedding_dimension,
            "chunk_size": settings.chunk_size,
            "chunk_overlap": settings.chunk_overlap,
            "batch_size": settings.embedding_batch_size
        }
    
    async def generate_report(self):
        """Generate and print comprehensive status report"""
        print("=" * 80)
        print("CropSense RAG System - Status Report")
        print("=" * 80)
        print(f"Project: {settings.google_cloud_project}")
        print(f"Database: {settings.firestore_database}")
        print(f"Vector Collection: {settings.vector_collection}")
        print("=" * 80)
        
        # 1. vectorChunks Status
        print("\n📦 vectorChunks Collection (Processed Documents)")
        print("-" * 80)
        vector_status = await self.get_vectorchunks_status()
        
        if "error" in vector_status:
            print(f"  ✗ Error: {vector_status['error']}")
        else:
            print(f"  Total chunks: {vector_status['total_chunks']:,}")
            print(f"  Unique documents: {vector_status['unique_documents']}")
            
            if vector_status['unique_documents'] > 0:
                print(f"\n  Processed documents:")
                for i, doc_id in enumerate(vector_status['document_ids'][:20], 1):
                    print(f"    [{i}] {doc_id}")
                
                if vector_status['unique_documents'] > 20:
                    print(f"    ... and {vector_status['unique_documents'] - 20} more")
        
        # 2. farming_knowledge Status
        print("\n📚 farming_knowledge Collection (Source Documents)")
        print("-" * 80)
        farming_status = await self.get_farming_knowledge_status()
        
        if "error" in farming_status:
            print(f"  ✗ Error: {farming_status['error']}")
        else:
            print(f"  Total documents: {farming_status['total_documents']}")
            
            if farming_status['total_documents'] > 0:
                print(f"\n  Documents:")
                for i, doc_id in enumerate(farming_status['document_ids'][:20], 1):
                    print(f"    [{i}] {doc_id}")
                
                if farming_status['total_documents'] > 20:
                    print(f"    ... and {farming_status['total_documents'] - 20} more")
        
        # 3. Document Status Tracking
        print("\n🔄 Document Processing Status")
        print("-" * 80)
        status_info = await self.get_document_status_collection()
        
        if "error" in status_info:
            print(f"  ✗ Error: {status_info['error']}")
        else:
            print(f"  Total tracked: {status_info['total_tracked']}")
            print(f"\n  Status breakdown:")
            for status, count in status_info['status_counts'].items():
                print(f"    {status}: {count}")
            
            # Show failed documents if any
            if status_info['status_counts']['failed'] > 0:
                print(f"\n  ⚠ Failed documents:")
                for doc_id in status_info['docs_by_status']['failed']:
                    print(f"    - {doc_id}")
            
            # Show processing documents if any
            if status_info['status_counts']['processing'] > 0:
                print(f"\n  ⏳ Currently processing:")
                for doc_id in status_info['docs_by_status']['processing']:
                    print(f"    - {doc_id}")
        
        # 4. Gemini Configuration
        print("\n🤖 Gemini AI Configuration")
        print("-" * 80)
        gemini_status = self.get_gemini_status()
        
        if gemini_status['enabled']:
            print(f"  ✓ Enabled")
            print(f"  Model: {gemini_status['model']}")
            print(f"  Max requests/hour: {gemini_status['max_requests_per_hour']}")
            print(f"  Fallback threshold: {gemini_status['fallback_threshold']}")
            print(f"  Cache TTL: {gemini_status['cache_ttl_hours']} hours")
        else:
            print(f"  ✗ Disabled")
        
        # 5. Embedding Configuration
        print("\n⚙️ Embedding Configuration")
        print("-" * 80)
        embed_config = self.get_embedding_config()
        print(f"  Model: {embed_config['model']}")
        print(f"  Dimension: {embed_config['dimension']}")
        print(f"  Chunk size: {embed_config['chunk_size']} chars")
        print(f"  Chunk overlap: {embed_config['chunk_overlap']} chars")
        print(f"  Batch size: {embed_config['batch_size']}")
        
        # 6. Analysis
        print("\n📊 Analysis")
        print("-" * 80)
        
        if "error" not in vector_status and "error" not in farming_status:
            processed_count = vector_status['unique_documents']
            source_count = farming_status['total_documents']
            
            if source_count == 0:
                print("  ℹ No source documents in farming_knowledge collection")
            elif processed_count == 0:
                print(f"  ⚠ {source_count} documents need processing (0% complete)")
            elif processed_count < source_count:
                pct = (processed_count / source_count) * 100
                remaining = source_count - processed_count
                print(f"  ⏳ {processed_count}/{source_count} documents processed ({pct:.1f}%)")
                print(f"  ⚠ {remaining} documents remaining")
            else:
                print(f"  ✓ All {processed_count} documents processed (100%)")
        
        print("\n" + "=" * 80)
        
        # 7. Recommendations
        print("\n💡 Recommendations")
        print("-" * 80)
        
        if "error" not in vector_status:
            if vector_status['unique_documents'] == 0:
                print("  → Run execute_full_ingestion.py to process documents")
            elif "error" not in farming_status and vector_status['unique_documents'] < farming_status['total_documents']:
                print("  → Run execute_full_ingestion.py to process remaining documents")
            else:
                print("  → System is ready! All documents are processed")
        
        if gemini_status['enabled']:
            print("  → Test /answer endpoint for Gemini-powered responses")
        else:
            print("  → Enable Gemini in .env to get AI-powered answers")
        
        print("=" * 80)


async def main():
    """Main entry point"""
    reporter = StatusReporter()
    await reporter.generate_report()


if __name__ == "__main__":
    asyncio.run(main())

