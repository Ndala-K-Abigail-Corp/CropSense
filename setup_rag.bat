@echo off
REM ===============================================
REM CropSense RAG Tool Setup Script for Windows
REM ===============================================

REM Step 1: Navigate to the RAG package
cd packages\rag

REM Step 2: Create Python virtual environment (if not exists)
if not exist ".venv" (
    python -m venv .venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

REM Step 3: Activate the virtual environment
call .venv\Scripts\activate.bat
echo Virtual environment activated.

REM Step 4: Upgrade pip
python -m pip install --upgrade pip

REM Step 5: Install required Python dependencies
pip install -r requirements.txt

REM Step 6: Authenticate to Google Cloud (Application Default Credentials)
echo Logging in to Google Cloud...
gcloud auth application-default login

REM Step 7: Instructions for running the RAG tool
echo.
echo =================================================
echo Setup complete!
echo You can now ingest documents and run the API:
echo 1. Ingest documents:
echo    python ingestion.py --pdf path\to\your\agricultural-guide.pdf --id ag-guide-2024 --name "Agricultural Guide"
echo 2. Run the API:
echo    python main.py
echo API will be available at http://localhost:8000
echo =================================================
pause
