import os
import subprocess
from google.cloud import firestore, storage

# -------------------------------
# CONFIGURATION
# -------------------------------
BUCKET_NAME = "farming-knowledge-base"
CORPUS_PREFIX = "farming-knowledge-base/"  # folder in your bucket
VECTOR_COLLECTION = "vectorChunks"
GCP_PROJECT = "cropsense-927f8"  # replace with your project ID

# -------------------------------
# 1️⃣ Setup Firestore & Storage clients
# -------------------------------
#os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "path/to/service_account.json"  # if not set globally
db = firestore.Client(project=GCP_PROJECT)
storage_client = storage.Client(project=GCP_PROJECT)
bucket = storage_client.bucket(BUCKET_NAME)

# -------------------------------
# 2️⃣ List all PDFs in bucket
# -------------------------------
blobs = bucket.list_blobs(prefix=CORPUS_PREFIX)
all_docs = [blob.name for blob in blobs if blob.name.endswith(".pdf")]
print(f"Total PDFs in bucket: {len(all_docs)}")

# -------------------------------
# 3️⃣ List already chunked documents
# -------------------------------
vector_chunks = db.collection(VECTOR_COLLECTION).stream()
chunked_docs = set([chunk.id.split("_")[0] for chunk in vector_chunks])
print(f"Total documents already chunked: {len(chunked_docs)}")

# -------------------------------
# 4️⃣ Identify missing documents
# -------------------------------
def format_doc_id(doc_name):
    return doc_name.replace("/", "_").replace(".pdf", "")

missing_docs = [doc for doc in all_docs if format_doc_id(doc) not in chunked_docs]
print(f"Documents to process: {len(missing_docs)}")

# -------------------------------
# 5️⃣ Ingest & chunk missing docs
# -------------------------------
def ingest(doc):
    doc_id = format_doc_id(doc)
    doc_name = doc.split("/")[-1].replace(".pdf", "")
    pdf_path = f"gs://{BUCKET_NAME}/{doc}"

    print(f"Ingesting {doc_name}...")
    subprocess.run([
        "python", "ingestion.py",
        "--pdf", pdf_path,
        "--id", doc_id,
        "--name", doc_name,
        "--type", "manual"
    ])

for doc in missing_docs:
    ingest(doc)

print("✅ All missing documents processed!")

# -------------------------------
# 6️⃣ Example Gemini query (basic)
# -------------------------------
# Pseudo-code: adapt to your Gemini client
# from gemini import GeminiClient
#
# gemini = GeminiClient(api_key="YOUR_GEMINI_API_KEY")
# query = "What crops are suitable for Lusaka?"
# results = gemini.query_vector_store(collection=VECTOR_COLLECTION, query=query)
# print(results)
