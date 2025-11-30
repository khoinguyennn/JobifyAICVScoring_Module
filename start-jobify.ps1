# Jobify AI CV Scoring - PowerShell Start Script
Write-Host "========================================" -ForegroundColor Blue
Write-Host "   Jobify AI CV Scoring - Quick Start" -ForegroundColor Blue  
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Check current directory
Write-Host "📁 Checking current directory..." -ForegroundColor Yellow
if (!(Test-Path "package.json")) {
    Write-Host "❌ package.json not found in current directory" -ForegroundColor Red
    Write-Host "📂 Current directory: $PWD" -ForegroundColor Gray
    Write-Host ""
    
    if (Test-Path "src\server\package.json") {
        Write-Host "✅ Found project files in current directory" -ForegroundColor Green
    } else {
        Write-Host "❌ Project files not found. Please navigate to:" -ForegroundColor Red
        Write-Host "   D:\HKI_2025-2026\CN\Jobify-AI-CV-Scoring" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✅ Found package.json in current directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Installing server dependencies..." -ForegroundColor Yellow
Set-Location "src\server"

if (!(Test-Path "node_modules")) {
    Write-Host "Installing npm packages..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔍 Checking environment configuration..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host "⚠️ .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "🚨 IMPORTANT: Please update .env file with your settings:" -ForegroundColor Red
    Write-Host "- GEMINI_API_KEY=your_api_key_here" -ForegroundColor Yellow
    Write-Host "- Database credentials" -ForegroundColor Yellow
    Read-Host "Press Enter to continue after updating .env"
}

Write-Host ""
Write-Host "🛠️ Testing TypeScript compilation..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript compilation failed" -ForegroundColor Red
    Write-Host "Check the errors above and fix them before continuing" -ForegroundColor Yellow
    Read-Host "Press Enter to continue anyway"
}

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Server will start in a new window" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5003" -ForegroundColor Cyan  
Write-Host "API Docs: http://localhost:5003/api-docs" -ForegroundColor Cyan
Write-Host "Test API: http://localhost:3000/test-api.html" -ForegroundColor Cyan
Write-Host ""

# Start backend server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend server in new window  
Set-Location "..\client"
Write-Host "🌐 Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python -m http.server 3000"

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host "Close the PowerShell windows to stop the servers" -ForegroundColor Yellow

Read-Host "Press Enter to exit this script"

