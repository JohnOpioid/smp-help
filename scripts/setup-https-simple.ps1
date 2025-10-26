# Simple HTTPS Setup
# Run as Administrator

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Simple HTTPS Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

$mkcertPath = "$env:TEMP\mkcert.exe"
$certDir = ".\cert"

# Create cert directory
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir | Out-Null
    Write-Host "Created cert directory" -ForegroundColor Green
}

# Download mkcert if not exists
if (-not (Test-Path $mkcertPath)) {
    Write-Host "Downloading mkcert..." -ForegroundColor Yellow
    $mkcertUrl = "https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-windows-amd64.exe"
    Invoke-WebRequest -Uri $mkcertUrl -OutFile $mkcertPath
    Write-Host "mkcert downloaded" -ForegroundColor Green
}

Write-Host ""
Write-Host "[1/2] Installing local CA certificate..." -ForegroundColor Yellow
& $mkcertPath -install

Write-Host ""
Write-Host "[2/2] Generating HTTPS certificates..." -ForegroundColor Yellow

$networkIP = "192.168.1.40"
& $mkcertPath -key-file "$certDir\localhost-key.pem" -cert-file "$certDir\localhost.pem" localhost 127.0.0.1 $networkIP

if ((Test-Path "$certDir\localhost-key.pem") -and (Test-Path "$certDir\localhost.pem")) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "   Certificates Generated Successfully!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "HTTPS URLs:" -ForegroundColor Cyan
    Write-Host "  Local:  https://localhost:3000" -ForegroundColor White
    Write-Host "  Remote: https://$networkIP` :3000" -ForegroundColor White
    Write-Host ""
    Write-Host "Now run: npm run dev" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to generate certificates!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

