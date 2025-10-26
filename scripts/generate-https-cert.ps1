# Generate HTTPS certificates for development
# Run as Administrator

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Generate HTTPS Certificates" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

$certDir = ".\cert"
$certPath = ".\cert\localhost.pem"
$keyPath = ".\cert\localhost-key.pem"

# Check if mkcert is installed
Write-Host "[1/3] Checking mkcert installation..." -ForegroundColor Yellow

$mkcert = Get-Command mkcert -ErrorAction SilentlyContinue

if (-not $mkcert) {
    Write-Host "⚠️  mkcert is not installed!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Installing mkcert via Chocolatey..." -ForegroundColor Cyan
    
    $choco = Get-Command choco -ErrorAction SilentlyContinue
    
    if (-not $choco) {
        Write-Host "ERROR: Chocolatey is not installed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install Chocolatey first:" -ForegroundColor Yellow
        Write-Host "  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" -ForegroundColor White
        Write-Host ""
        Write-Host "Or install mkcert manually from: https://github.com/FiloSottile/mkcert" -ForegroundColor Yellow
        exit 1
    }
    
    choco install mkcert -y
    
    # Add mkcert to PATH if needed
    $env:Path += ";C:\ProgramData\chocolatey\bin"
    
    Write-Host "✅ mkcert installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ mkcert is already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/3] Installing mkcert root certificate..." -ForegroundColor Yellow

# Install local CA
mkcert -install

Write-Host "✅ Root certificate installed!" -ForegroundColor Green

Write-Host ""
Write-Host "[3/3] Generating certificates..." -ForegroundColor Yellow

# Create cert directory
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir | Out-Null
}

# Generate certificates for localhost and network IP
$networkIP = "192.168.1.40"

Write-Host "Generating certificates for:" -ForegroundColor Cyan
Write-Host "  - localhost" -ForegroundColor White
Write-Host "  - $networkIP" -ForegroundColor White

mkcert -key-file $keyPath -cert-file $certPath localhost 127.0.0.1 $networkIP

if (Test-Path $keyPath -and Test-Path $certPath) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "   Certificates Generated Successfully!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Certificate files:" -ForegroundColor Cyan
    Write-Host "  Cert: $certPath" -ForegroundColor White
    Write-Host "  Key:  $keyPath" -ForegroundColor White
    Write-Host ""
    Write-Host "HTTPS URLs:" -ForegroundColor Cyan
    Write-Host "  Local:  https://localhost:3000" -ForegroundColor White
    Write-Host "  Remote: https://$networkIP` :3000" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now run: npm run dev" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to generate certificates!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

