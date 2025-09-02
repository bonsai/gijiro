# Setup PATH for Node.js and npm
# Run this script as Administrator for system-wide changes

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
}

# Set Node.js and npm paths
$nodePath = "$env:ProgramFiles\nodejs"
$npmPath = "$env:APPDATA\npm"

# Get current PATH
$currentPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')

# Add Node.js and npm to PATH if not already present
if ($currentPath -notlike "*$nodePath*") {
    [Environment]::SetEnvironmentVariable('Path', $currentPath + ";$nodePath", 'Machine')
    Write-Host "Added Node.js to PATH" -ForegroundColor Green
}

if ($currentPath -notlike "*$npmPath*") {
    [Environment]::SetEnvironmentVariable('Path', $currentPath + ";$npmPath", 'Machine')
    Write-Host "Added npm to PATH" -ForegroundColor Green
}

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Cyan

# Reload PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")

# Check versions
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
    Write-Host "`nPATH setup completed successfully!" -ForegroundColor Green
    Write-Host "You may need to restart your terminal or IDE for changes to take effect." -ForegroundColor Yellow
} catch {
    Write-Host "Error: Node.js or npm not found. Please ensure Node.js is installed." -ForegroundColor Red
    Write-Host "You can download it from: https://nodejs.org/" -ForegroundColor Yellow
}

# Keep the window open
Write-Host "`nPress any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
