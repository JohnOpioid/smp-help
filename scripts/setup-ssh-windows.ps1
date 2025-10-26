# Script for setting up SSH Server on Windows
# Run as Administrator

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   SSH Server Setup for Windows" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Step 1: Check if OpenSSH Server is installed
Write-Host "`n[1/5] Checking OpenSSH Server installation..." -ForegroundColor Yellow

$openSSHServer = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'

if ($openSSHServer.State -ne 'Installed') {
    Write-Host "OpenSSH Server is not installed. Installing..." -ForegroundColor Yellow
    
    try {
        Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
        Write-Host "OpenSSH Server installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to install OpenSSH Server: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "OpenSSH Server is already installed!" -ForegroundColor Green
}

# Step 2: Start SSH service
Write-Host "`n[2/5] Starting SSH service..." -ForegroundColor Yellow

try {
    Start-Service sshd
    Set-Service -Name sshd -StartupType 'Automatic'
    Write-Host "SSH service started and set to auto-start!" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not start SSH service: $_" -ForegroundColor Yellow
}

# Step 3: Configure Firewall
Write-Host "`n[3/5] Configuring Windows Firewall..." -ForegroundColor Yellow

# Check if firewall rule already exists
$existingRule = Get-NetFirewallRule -Name 'ssh-port' -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "Firewall rule already exists. Removing old rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -Name 'ssh-port' -ErrorAction SilentlyContinue
}

try {
    New-NetFirewallRule -Name 'ssh-port' -DisplayName 'SSH (OpenSSH)' -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
    Write-Host "Firewall rule created successfully!" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not create firewall rule: $_" -ForegroundColor Yellow
    Write-Host "You may need to manually allow port 22 in Windows Firewall" -ForegroundColor Yellow
}

# Step 4: Get network IP addresses
Write-Host "`n[4/5] Getting network information..." -ForegroundColor Yellow

$networkAdapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -notlike '127.0.0.1' | Select-Object IPAddress, InterfaceAlias

Write-Host "Your computer can be accessed via SSH at:" -ForegroundColor Cyan
foreach ($adapter in $networkAdapters) {
    Write-Host "  ssh username@$($adapter.IPAddress)" -ForegroundColor White
}

# Step 5: Optional - Create SSH user
Write-Host "`n[5/5] User information..." -ForegroundColor Yellow
Write-Host "To connect via SSH, use your Windows username and password" -ForegroundColor Cyan
Write-Host "Example: ssh username@192.168.1.40" -ForegroundColor White

# Show current username
$currentUser = $env:USERNAME
Write-Host "`nCurrent user: $currentUser" -ForegroundColor Cyan

# Summary
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "   SSH Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "`nSSH Server Status:" -ForegroundColor Cyan
Get-Service sshd | Format-Table -AutoSize

Write-Host "`nTo test SSH connection from another computer:" -ForegroundColor Yellow
Write-Host "  ssh $currentUser@192.168.1.40" -ForegroundColor White

Write-Host "`nTo check SSH status:" -ForegroundColor Yellow
Write-Host "  Get-Service sshd" -ForegroundColor White

Write-Host "`nTo view SSH logs:" -ForegroundColor Yellow
Write-Host "  Get-EventLog -LogName Application -Source OpenSSH* -Newest 10" -ForegroundColor White

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


