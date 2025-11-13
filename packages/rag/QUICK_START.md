# CropSense RAG - Quick Start Guide

## 🚀 Quick Commands

### Check System Status
```bash
cd packages/rag
python status_report.py
```

### Process Remaining Documents (5 at a time)
```bash
python ingest_remaining.py --max 5
```

### Start RAG API Server
```bash
python main.py
# Server runs on http://localhost:8000
```

### Test Gemini Integration
```bash
python test_gemini_integration.py
```

### Quick Data Check
```bash
python check_data.py
```

---

## 📊 Current Status (Run `status_report.py` for latest)

- **Chunks**: 230+
- **Documents**: 5/40
- **Completion**: ~20%
- **Gemini**: ✅ Enabled & Working

---

## 🔥 Common Tasks

### 1. Process ALL Remaining Documents
```bash
# Loop until done (processes 5 at a time)
while true; do
    python ingest_remaining.py --max 5
    python status_report.py | grep "Remaining unprocessed: 0" && break
    sleep 10
done
```

### 2. Test a Query (Command Line)
```bash
curl -X POST http://localhost:8000/answer \
  -H "Content-Type: application/json" \
  -d '{"query": "How to prevent tomato blight?", "use_rag": true}'
```

### 3. Deploy Cloud Function
```bash
cd ../../functions
firebase deploy --only functions:processNewDocument
```

### 4. View Logs
```bash
# API server logs (if running)
tail -f nohup.out

# Or check structured logs in terminal where server is running
```

---

##  🛠️ Troubleshooting

**Q: "No documents to process"**  
A: All done! Check with `python status_report.py`

**Q: "Transaction too big" error**  
A: Fixed! Batch size is now 50 (was 500)

**Q: PDF extraction fails**  
A: Some PDFs are scanned images. These are automatically skipped.

**Q: Gemini not working**  
A: Check `.env` file has `GEMINI_ENABLED=True` and correct project ID

---

## 📁 Important Files

- `.env` - Configuration (copy from `env.example` if missing)
- `main.py` - API server
- `ingest_remaining.py` - **Main ingestion script**
- `status_report.py` - System overview
- `DEPLOYMENT_COMPLETE.md` - Full documentation

---

## 🎯 Goal: 100% Ingestion

Run this until completion:
```bash
python ingest_remaining.py --max 5
```

Check progress:
```bash
python status_report.py
```

Expected: ~4-6 hours for all 40 documents (in batches)

---

## ✅ Verification Checklist

- [ ] All documents processed (`status_report.py` shows 100%)
- [ ] API server runs without errors (`python main.py`)
- [ ] Test query returns results
- [ ] Gemini integration tested (`test_gemini_integration.py`)
- [ ] Cloud Function deployed (optional)

---

**Need Help?** See `DEPLOYMENT_COMPLETE.md` for detailed documentation.


