# Chhaya Printing Solution - Setup Script
# Run this script to set up the application

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Chhaya Printing Invoice App - Setup Wizard  " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm installation..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Checking MongoDB..." -ForegroundColor Yellow
$mongoCheck = mongo --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ MongoDB is installed" -ForegroundColor Green
    
    # Try to start MongoDB service
    Write-Host "Attempting to start MongoDB service..." -ForegroundColor Gray
    net start MongoDB 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB service started" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not start MongoDB service automatically" -ForegroundColor Yellow
        Write-Host "   Please start MongoDB manually if using local instance" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  MongoDB not detected locally" -ForegroundColor Yellow
    Write-Host "   If using MongoDB Atlas, update MONGODB_URI in .env.local" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 3: Creating admin user..." -ForegroundColor Yellow
Write-Host "Please make sure MongoDB is running..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# Check if server needs to be started first
Write-Host "Starting Express server temporarily..." -ForegroundColor Gray
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node server/index.js
}

Start-Sleep -Seconds 3

# Create admin
node utils/createAdmin.js

# Stop temporary server
Stop-Job -Job $serverJob
Remove-Job -Job $serverJob

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! 🎉" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Ensure MongoDB is running" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Open: http://localhost:3000" -ForegroundColor White
Write-Host "4. Login with:" -ForegroundColor White
Write-Host "   Email: admin@chhayaprinting.com" -ForegroundColor Cyan
Write-Host "   Password: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed guide, see QUICKSTART.md" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Would you like to start the application now? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Starting application..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    npm run dev
}
