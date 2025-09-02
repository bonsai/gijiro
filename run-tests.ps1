# Run tests with proper Node.js path
$nodePath = "$env:ProgramFiles\nodejs\node.exe"

if (-not (Test-Path $nodePath)) {
    Write-Host "Node.js not found at $nodePath" -ForegroundColor Red
    Write-Host "Please ensure Node.js is installed and added to your PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running tests with Node.js from: $nodePath" -ForegroundColor Cyan

# Run the simple test script
& $nodePath test.js

# If you want to run Jest tests once they're working, uncomment the following lines:
# Write-Host "`nRunning Jest tests..." -ForegroundColor Cyan
# & $nodePath node_modules/jest/bin/jest.js --no-cache

Write-Host "`nDone!" -ForegroundColor Green
