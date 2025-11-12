/**
 * Cloud Function: Auto-process documents uploaded to Cloud Storage
 * Supports PDF, DOCX, and TXT files
 * Triggers when a new file is uploaded to the documents bucket
 * Extracts text, generates embeddings, stores in vectorChunks
 * Tracks processing status to prevent duplicates
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import * as pdfParse from 'pdf-parse';
import { Document as DocxDocument } from 'docx';
import * as mammoth from 'mammoth';

const storage = new Storage();
const db = admin.firestore();
const DOCUMENT_STATUS_COLLECTION = 'document_status';

interface ChunkData {
  text: string;
  page: number;
  chunkIndex: number;
  tokens: number;
}

/**
 * Chunk text intelligently with overlap
 */
function chunkText(
  text: string,
  pageNumber: number,
  maxChars: number = 512,
  overlapChars: number = 50
): ChunkData[] {
  const chunks: ChunkData[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = '';
  let currentChars = 0;
  
  for (const para of paragraphs) {
    const paraChars = para.length;
    
    if (currentChars + paraChars > maxChars && currentChunk) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        page: pageNumber,
        chunkIndex: chunks.length,
        tokens: Math.floor(currentChunk.length / 4),
      });
      
      // Start new chunk with overlap
      if (overlapChars > 0) {
        const overlapText = currentChunk.slice(-overlapChars);
        currentChunk = overlapText + '\n\n' + para;
        currentChars = overlapText.length + paraChars;
      } else {
        currentChunk = para;
        currentChars = paraChars;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
      currentChars += paraChars;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      page: pageNumber,
      chunkIndex: chunks.length,
      tokens: Math.floor(currentChunk.length / 4),
    });
  }
  
  return chunks;
}

/**
 * Extract text from PDF
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfData = await pdfParse(buffer);
  return pdfData.text;
}

/**
 * Extract text from DOCX
 */
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Extract text from TXT
 */
async function extractTextFromTxt(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

/**
 * Extract text based on file type
 */
async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return extractTextFromPdf(buffer);
    case 'docx':
    case 'doc':
      return extractTextFromDocx(buffer);
    case 'txt':
      return extractTextFromTxt(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Generate embeddings using Vertex AI
 */
async function generateEmbeddings(
  texts: string[],
  projectId: string,
  location: string = 'us-east1'
): Promise<number[][]> {
  const aiplatform = require('@google-cloud/aiplatform');
  const {PredictionServiceClient} = aiplatform.v1;
  const {helpers} = aiplatform;

  const client = new PredictionServiceClient({
    apiEndpoint: `${location}-aiplatform.googleapis.com`,
  });

  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/text-embedding-005`;

  const instances = texts.map(text => 
    helpers.toValue({
      content: text,
      task_type: 'RETRIEVAL_DOCUMENT'
    })
  );

  const parameters = helpers.toValue({
    outputDimensionality: 768
  });

  const request = {
    endpoint,
    instances,
    parameters,
  };

  const [response] = await client.predict(request);
  const embeddings = response.predictions?.map((pred: any) => pred.embeddings.values) || [];
  
  return embeddings;
}

/**
 * Update document processing status
 */
async function updateDocumentStatus(
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  metadata?: any,
  errorMessage?: string
): Promise<void> {
  const statusRef = db.collection(DOCUMENT_STATUS_COLLECTION).doc(documentId);
  
  const updateData: any = {
    documentId,
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  if (metadata) {
    updateData.metadata = metadata;
  }
  
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }
  
  // Check if document exists
  const doc = await statusRef.get();
  if (!doc.exists) {
    updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
  }
  
  await statusRef.set(updateData, { merge: true });
}

/**
 * Check if document has already been processed
 */
async function isDocumentProcessed(documentId: string): Promise<boolean> {
  const statusRef = db.collection(DOCUMENT_STATUS_COLLECTION).doc(documentId);
  const doc = await statusRef.get();
  
  if (!doc.exists) {
    return false;
  }
  
  const data = doc.data();
  return data?.status === 'completed';
}

/**
 * Main Cloud Function
 */
export const processNewDocument = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .storage.object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const bucket = object.bucket;

    if (!filePath) {
      console.log('No file path, skipping');
      return null;
    }

    // Check file extension
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const supportedExtensions = ['pdf', 'docx', 'doc', 'txt'];
    
    if (!fileExtension || !supportedExtensions.includes(fileExtension)) {
      console.log(`Unsupported file type: ${fileExtension}, skipping`);
      return null;
    }

    // Check if in agricultural documents folder
    if (!filePath.startsWith('farming-documents/') && !filePath.startsWith('agricultural-docs/')) {
      console.log('Not in farming documents folder, skipping');
      return null;
    }

    const documentId = filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'unknown';
    console.log(`Processing new document: ${filePath} (${fileExtension.toUpperCase()})`);

    try {
      // Check if already processed
      const alreadyProcessed = await isDocumentProcessed(documentId);
      if (alreadyProcessed) {
        console.log(`Document ${documentId} already processed, skipping`);
        return null;
      }

      // Update status to processing
      await updateDocumentStatus(documentId, 'processing', {
        gcsPath: `gs://${bucket}/${filePath}`,
        fileType: fileExtension,
        startedAt: new Date().toISOString(),
      });

      // 1. Download file from bucket
      const file = storage.bucket(bucket).file(filePath);
      const [fileBuffer] = await file.download();

      // 2. Extract text from document
      console.log(`Extracting text from ${fileExtension.toUpperCase()}...`);
      const fullText = await extractText(fileBuffer, fileExtension);

      if (!fullText || fullText.trim().length === 0) {
        throw new Error(`No text extracted from ${fileExtension.toUpperCase()}`);
      }

      console.log(`Extracted ${fullText.length} characters`);

      // 3. Chunk the text
      console.log('Chunking text...');
      const chunks = chunkText(fullText, 1); // Simplified - treating as single page
      console.log(`Created ${chunks.length} chunks`);

      if (chunks.length === 0) {
        console.error('No chunks created');
        return null;
      }

      // 4. Generate embeddings
      console.log('Generating embeddings...');
      const projectId = process.env.GCLOUD_PROJECT!;
      const batchSize = 20;
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batchChunks = chunks.slice(i, i + batchSize);
        const batchTexts = batchChunks.map(c => c.text);
        const batchEmbeddings = await generateEmbeddings(batchTexts, projectId);
        allEmbeddings.push(...batchEmbeddings);
      }

      // 5. Store in Firestore vectorChunks
      console.log('Storing in Firestore...');
      const documentId = filePath.split('/').pop()?.replace('.pdf', '') || 'unknown';
      const batch = db.batch();

      chunks.forEach((chunk, idx) => {
        const chunkId = `${documentId}_chunk_${String(idx).padStart(4, '0')}`;
        const chunkRef = db.collection('vectorChunks').doc(chunkId);

        batch.set(chunkRef, {
          id: chunkId,
          content: chunk.text,
          embedding: allEmbeddings[idx],
          embeddingDim: allEmbeddings[idx].length,
          metadata: {
            documentId,
            source: documentId.replace(/-/g, ' ').replace(/_/g, ' '),
            pageNumber: chunk.page,
            chunkIndex: chunk.chunkIndex,
            documentType: 'agricultural_guide',
            originalPath: filePath,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();

      // 6. Update document status to completed
      await updateDocumentStatus(documentId, 'completed', {
        gcsPath: `gs://${bucket}/${filePath}`,
        fileType: fileExtension,
        chunks: chunks.length,
        completedAt: new Date().toISOString(),
      });

      // 7. Update farming_knowledge metadata (for backward compatibility)
      await db.collection('farming_knowledge').doc(documentId).set({
        name: documentId,
        status: 'processed',
        total_chunks: chunks.length,
        gcsPath: `gs://${bucket}/${filePath}`,
        fileType: fileExtension,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`✅ Successfully processed ${documentId}: ${chunks.length} chunks`);
      return null;

    } catch (error) {
      console.error('Error processing document:', error);
      
      // Update status to failed
      const documentId = filePath?.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'unknown';
      await updateDocumentStatus(
        documentId,
        'failed',
        undefined,
        error instanceof Error ? error.message : String(error)
      );
      
      // Don't throw error to prevent function retries
      return null;
    }
  });

