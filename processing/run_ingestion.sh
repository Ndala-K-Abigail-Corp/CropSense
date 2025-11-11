#!/bin/bash
# Run framework ingestion script
# This processes framework PDFs and generates embeddings

cd "$(dirname "$0")"

echo "Starting framework PDF ingestion..."
echo "This will process all framework PDFs and generate embeddings."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not found. Please install Python 3."
    exit 1
fi

# Check if required packages are installed
python3 -c "import google.cloud.firestore" 2>/dev/null || {
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
}

# Set environment variables
export GOOGLE_APPLICATION_CREDENTIALS="${GOOGLE_APPLICATION_CREDENTIALS:-~/.config/gcloud/application_default_credentials.json}"
export PROJECT_ID="governnce-gap-analyzer"

# Run the ingestion script
python3 process_frameworks.py

echo "Framework ingestion complete!"

