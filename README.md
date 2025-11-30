# 🤖 Jobify AI CV Scoring System

Hệ thống chấm điểm CV thông minh sử dụng Google Gemini AI với khả năng xử lý đa định dạng file và phân tích sâu.

## ⚡ Quick Start

### 🚨 LATEST FIXES (Dec 2024):
- ✅ TypeScript compilation errors fixed  
- ✅ Gemini AI model error (`gemini-1.5-flash` → `gemini-pro`)  
- ✅ Package.json not found error resolved
- ✅ Enhanced error handling and fallbacks

### 🚀 EASY START (Choose One):

#### Option 1: PowerShell (Windows - Recommended)
```powershell
# Right-click start-jobify.ps1 → "Run with PowerShell"
# OR run in PowerShell:
.\start-jobify.ps1
```

#### Option 2: Batch File (Windows)
```batch
fix-and-start.bat
```

#### Option 3: Direct Commands
```bash
# Navigate to project root first!
cd D:\HKI_2025-2026\CN\Jobify-AI-CV-Scoring
cd src\server
npm run dev
```

### Manual Start:
```bash
# Option 1: From project root
npm run dev  

# Option 2: Direct server start  
cd src/server && npm run dev

# Option 3: Step by step
cd src/server
npm install
npm run dev
```

## 🆘 Common Issues & Quick Fixes

### Issue: "npm error enoent Could not read package.json"
**Solution**: You're in the wrong directory!
```bash
# Check where you are:
pwd  # Linux/Mac
echo %CD%  # Windows

# Navigate to project root:
cd D:\HKI_2025-2026\CN\Jobify-AI-CV-Scoring

# Verify you're in the right place:
dir package.json  # Should exist
dir src\server     # Should exist
```

### Issue: "TSError: Unable to compile TypeScript"  
**Solution**: Already fixed! Just restart server:
```bash
cd src\server
npm run dev
```

### Issue: "Gemini AI 404 Model Error"
**Solution**: Model updated to `gemini-pro` - should work now!

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5003  
- **API Docs**: http://localhost:5003/api-docs

## 🚀 Features

✅ **AI-Powered CV Analysis** - Google Gemini AI scoring  
✅ **Multi-Format Support** - PDF, DOCX, JPG, PNG  
✅ **Smart Job Matching** - Skills analysis & suggestions  
✅ **OCR Processing** - Text extraction from images  
✅ **Real-time Scoring** - Instant feedback and improvements  
✅ **Modern UI** - Responsive design with drag-drop upload

## 📋 Setup Requirements

- Node.js 18+
- Python 3.7+ (for frontend server)
- MySQL database
- Google Gemini API key

## 🔧 Configuration

1. **Copy environment file:**
```bash
cp src/server/.env.example src/server/.env
```

2. **Update .env with your settings:**
```env
GEMINI_API_KEY=your_api_key_here
DB_PASSWORD=your_db_password
```

3. **Install dependencies:**
```bash
npm run install-all
```

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Detailed installation
- [Test Workflow](TEST_WORKFLOW.md) - How to test features  
- [CORS Troubleshooting](CORS_TROUBLESHOOTING.md) - Fix connection issues

## 🎯 Demo Workflow

1. Upload CV file (or skip for demo mode)
2. Select job from searchable list
3. Click "Chấm Điểm CV với AI"  
4. Get AI analysis with score, strengths, weaknesses & suggestions

## 🛠 Tech Stack

**Backend:** Node.js, TypeScript, Express, MySQL  
**AI:** Google Gemini API  
**Processing:** pdf-parse, mammoth, tesseract.js  
**Frontend:** Vanilla JS, HTML5, CSS3  

## 📊 API Endpoints

- `GET /api/jobs` - Job listings with search/filter
- `GET /api/jobs/{id}` - Job details  
- `POST /api/cv-score` - Real CV scoring with file
- `POST /api/cv-score/demo` - Demo scoring without file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Test thoroughly  
4. Submit pull request

## 📄 License

MIT License - See LICENSE file for details
