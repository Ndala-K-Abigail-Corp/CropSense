# PowerShell script to run framework ingestion
# This processes framework PDFs and generates embeddings

Write-Host "Starting framework PDF ingestion..." -ForegroundColor Green
Write-Host "This will process all framework PDFs and generate embeddings."

# Check if Python is available
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "Python is required but not found. Please install Python 3." -ForegroundColor Red
    exit 1
}

# Check if required packages are installed
python -c "import google.cloud.firestore" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Set environment variables
$env:GOOGLE_APPLICATION_CREDENTIALS = if ($env:GOOGLE_APPLICATION_CREDENTIALS) { $env:GOOGLE_APPLICATION_CREDENTIALS } else { "$HOME\.config\gcloud\application_default_credentials.json" }
$env:PROJECT_ID = "governnce-gap-analyzer"

# Run the ingestion script
python process_frameworks.py

Write-Host "Framework ingestion complete!" -ForegroundColor Green

