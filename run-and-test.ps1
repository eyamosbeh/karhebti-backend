# Start server in background
Write-Host "🚀 Starting server..." -ForegroundColor Green
$serverJob = Start-Job -ScriptBlock {
    Set-Location 'c:\Users\Mosbeh Eya\Downloads\karhebti-backend-master (1)\karhebti-backend-master'
    npm run start:dev 2>&1
} -Name "NestServer"

# Wait for server to start
Write-Host "⏳ Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test if server is responding
Write-Host "🔍 Checking if server is responding..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Server is responding!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Server did not respond: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Job -Job $serverJob
    Remove-Job -Job $serverJob
    exit 1
}

# Run notification test
Write-Host "`n📬 Running notification test...`n" -ForegroundColor Green
& '.\send-test-notification.ps1' 2>&1
$testResult = $LASTEXITCODE

# Stop server
Write-Host "`n🛑 Stopping server..." -ForegroundColor Yellow
Stop-Job -Job $serverJob
Remove-Job -Job $serverJob -Force

if ($testResult -eq 0) {
    Write-Host "✅ Test completed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Test completed with exit code: $testResult" -ForegroundColor Yellow
}
