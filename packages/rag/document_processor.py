"""
Enhanced document processor with support for PDF, DOCX, TXT files
Tracks processing status and prevents duplicate processing
"""

import io
import re
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime
from google.cloud import storage, firestore
from config import settings
from logger import logger


class DocumentProcessor:
    """Enhanced document processor with multi-format support"""

    def __init__(self):
        self.storage_client = storage.Client(project=settings.google_cloud_project)
        self.db = firestore.Client(
            project=settings.google_cloud_project,
            database=settings.firestore_database
        )
        self.status_collection = "document_status"
        
    def extract_text_from_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Extract text from PDF file with page information
        
        Args:
            file_path: Path to PDF file (local or GCS)
            
        Returns:
            List of dictionaries with 'text' and 'page' keys
        """
        try:
            import pdfplumber
            
            text_items = []
            
            # Handle GCS paths
            if file_path.startswith("gs://"):
                parts = file_path.replace("gs://", "").split("/", 1)
                bucket_name = parts[0]
                blob_name = parts[1]
                
                bucket = self.storage_client.bucket(bucket_name)
                blob = bucket.blob(blob_name)
                pdf_bytes = blob.download_as_bytes()
                pdf_file = io.BytesIO(pdf_bytes)
            else:
                pdf_file = file_path
            
            with pdfplumber.open(pdf_file) as pdf:
                for page_num, page in enumerate(pdf.pages, start=1):
                    try:
                        text = page.extract_text()
                        if text and text.strip():
                            text_items.append({
                                "text": text.strip(),
                                "page": page_num,
                                "total_pages": len(pdf.pages)
                            })
                    except Exception as page_error:
                        logger.warning(f"Error extracting text from page {page_num}: {page_error}")
                        continue
            
            return text_items
            
        except ImportError:
            logger.error("pdfplumber not installed")
            raise ImportError("pdfplumber not installed. Install with: pip install pdfplumber")
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise

    def extract_text_from_docx(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Extract text from DOCX file
        
        Args:
            file_path: Path to DOCX file (local or GCS)
            
        Returns:
            List of dictionaries with 'text' and 'page' keys
        """
        try:
            from docx import Document
            
            # Handle GCS paths
            if file_path.startswith("gs://"):
                parts = file_path.replace("gs://", "").split("/", 1)
                bucket_name = parts[0]
                blob_name = parts[1]
                
                bucket = self.storage_client.bucket(bucket_name)
                blob = bucket.blob(blob_name)
                docx_bytes = blob.download_as_bytes()
                docx_file = io.BytesIO(docx_bytes)
            else:
                docx_file = file_path
            
            doc = Document(docx_file)
            
            # Combine all paragraphs
            full_text = "\n\n".join([para.text for para in doc.paragraphs if para.text.strip()])
            
            if not full_text.strip():
                logger.warning("No text extracted from DOCX")
                return []
            
            return [{
                "text": full_text,
                "page": 1,
                "total_pages": 1
            }]
            
        except ImportError:
            logger.error("python-docx not installed")
            raise ImportError("python-docx not installed. Install with: pip install python-docx")
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
            raise

    def extract_text_from_txt(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Extract text from TXT file
        
        Args:
            file_path: Path to TXT file (local or GCS)
            
        Returns:
            List of dictionaries with 'text' and 'page' keys
        """
        try:
            # Handle GCS paths
            if file_path.startswith("gs://"):
                parts = file_path.replace("gs://", "").split("/", 1)
                bucket_name = parts[0]
                blob_name = parts[1]
                
                bucket = self.storage_client.bucket(bucket_name)
                blob = bucket.blob(blob_name)
                text = blob.download_as_text()
            else:
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            
            if not text.strip():
                logger.warning("No text in TXT file")
                return []
            
            return [{
                "text": text.strip(),
                "page": 1,
                "total_pages": 1
            }]
            
        except Exception as e:
            logger.error(f"Error reading TXT file: {e}")
            raise

    def extract_text(self, file_path: str, file_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Extract text from any supported file format
        
        Args:
            file_path: Path to file (local or GCS)
            file_type: File type (pdf, docx, txt). If None, inferred from extension
            
        Returns:
            List of text items with page information
        """
        if file_type is None:
            # Infer from extension
            ext = Path(file_path).suffix.lower()
            file_type = ext.lstrip('.')
        
        file_type = file_type.lower()
        
        logger.info(f"Extracting text from {file_type.upper()} file: {file_path}")
        
        if file_type == 'pdf':
            return self.extract_text_from_pdf(file_path)
        elif file_type in ['docx', 'doc']:
            return self.extract_text_from_docx(file_path)
        elif file_type == 'txt':
            return self.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    def calculate_file_hash(self, file_path: str) -> str:
        """
        Calculate SHA-256 hash of file for deduplication
        
        Args:
            file_path: Path to file (local or GCS)
            
        Returns:
            SHA-256 hash as hex string
        """
        try:
            if file_path.startswith("gs://"):
                parts = file_path.replace("gs://", "").split("/", 1)
                bucket_name = parts[0]
                blob_name = parts[1]
                
                bucket = self.storage_client.bucket(bucket_name)
                blob = bucket.blob(blob_name)
                file_bytes = blob.download_as_bytes()
            else:
                with open(file_path, 'rb') as f:
                    file_bytes = f.read()
            
            return hashlib.sha256(file_bytes).hexdigest()
            
        except Exception as e:
            logger.error(f"Error calculating file hash: {e}")
            raise

    async def get_document_status(self, document_id: str) -> Optional[Dict[str, Any]]:
        """
        Get processing status for a document
        
        Args:
            document_id: Document identifier
            
        Returns:
            Document status dict or None if not found
        """
        try:
            doc_ref = self.db.collection(self.status_collection).document(document_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            return None
            
        except Exception as e:
            logger.error(f"Error getting document status: {e}")
            return None

    async def update_document_status(
        self, 
        document_id: str, 
        status: str,
        metadata: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> None:
        """
        Update document processing status
        
        Args:
            document_id: Document identifier
            status: Status string (pending, processing, completed, failed)
            metadata: Additional metadata
            error_message: Error message if failed
        """
        try:
            doc_ref = self.db.collection(self.status_collection).document(document_id)
            
            update_data = {
                "documentId": document_id,
                "status": status,
                "updatedAt": firestore.SERVER_TIMESTAMP,
            }
            
            if metadata:
                update_data["metadata"] = metadata
            
            if error_message:
                update_data["errorMessage"] = error_message
            
            # If new document, set createdAt
            existing_doc = doc_ref.get()
            if not existing_doc.exists:
                update_data["createdAt"] = firestore.SERVER_TIMESTAMP
            
            doc_ref.set(update_data, merge=True)
            
            logger.info(f"Updated status for {document_id}: {status}")
            
        except Exception as e:
            logger.error(f"Error updating document status: {e}")
            raise

    async def is_document_processed(self, document_id: str, file_hash: Optional[str] = None) -> bool:
        """
        Check if document has already been processed
        
        Args:
            document_id: Document identifier
            file_hash: Optional file hash for content-based deduplication
            
        Returns:
            True if document is already processed
        """
        try:
            # Check by document ID
            status = await self.get_document_status(document_id)
            if status and status.get("status") == "completed":
                logger.info(f"Document {document_id} already processed")
                return True
            
            # Check by file hash if provided
            if file_hash:
                query = self.db.collection(self.status_collection).where(
                    "fileHash", "==", file_hash
                ).where(
                    "status", "==", "completed"
                ).limit(1)
                
                docs = list(query.stream())
                if docs:
                    logger.info(f"Document with hash {file_hash[:16]}... already processed")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking document status: {e}")
            return False

    async def list_gcs_documents(
        self, 
        bucket_name: str, 
        prefix: str = "", 
        file_extensions: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        List documents in GCS bucket
        
        Args:
            bucket_name: GCS bucket name
            prefix: Path prefix to filter files
            file_extensions: List of file extensions to include (e.g., ['pdf', 'docx', 'txt'])
            
        Returns:
            List of document info dictionaries
        """
        if file_extensions is None:
            file_extensions = ['pdf', 'docx', 'txt']
        
        try:
            bucket = self.storage_client.bucket(bucket_name)
            blobs = bucket.list_blobs(prefix=prefix)
            
            documents = []
            for blob in blobs:
                # Check file extension
                ext = Path(blob.name).suffix.lower().lstrip('.')
                if ext not in file_extensions:
                    continue
                
                # Skip directories
                if blob.name.endswith('/'):
                    continue
                
                documents.append({
                    "name": blob.name,
                    "bucket": bucket_name,
                    "gcs_path": f"gs://{bucket_name}/{blob.name}",
                    "size_bytes": blob.size,
                    "updated": blob.updated,
                    "file_type": ext,
                    "document_id": Path(blob.name).stem  # Filename without extension
                })
            
            logger.info(f"Found {len(documents)} documents in gs://{bucket_name}/{prefix}")
            return documents
            
        except Exception as e:
            logger.error(f"Error listing GCS documents: {e}")
            raise

    async def get_unprocessed_documents(
        self, 
        bucket_name: str, 
        prefix: str = "",
        file_extensions: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get list of documents that haven't been processed yet
        
        Args:
            bucket_name: GCS bucket name
            prefix: Path prefix to filter files
            file_extensions: List of file extensions to include
            
        Returns:
            List of unprocessed document info dictionaries
        """
        all_documents = await self.list_gcs_documents(bucket_name, prefix, file_extensions)
        
        unprocessed = []
        for doc in all_documents:
            is_processed = await self.is_document_processed(doc["document_id"])
            if not is_processed:
                unprocessed.append(doc)
        
        logger.info(f"Found {len(unprocessed)} unprocessed documents out of {len(all_documents)} total")
        return unprocessed


# Singleton instance
document_processor = DocumentProcessor()

