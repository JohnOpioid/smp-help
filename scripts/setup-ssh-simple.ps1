# Simple SSH Setup Script (without admin check)
# Run PowerShell as Administrator manually, then execute this

Write-Host "Setting up SSH Server..." -ForegroundColor Cyan

# Check if OpenSSH Server is installed
$openSSHServer = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'

if ($openSSHServer.State -ne 'Installed') {
    Write-Host "Installing OpenSSH Server..." -ForegroundColor Yellow
    Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
}

# Start and configure SSH service
Write-Host "Starting SSH service..." -ForegroundColor Yellow
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

# Configure firewall
Write-Host "Configuring firewall..." -ForegroundColor Yellow
Remove-NetFirewallRule -Name 'ssh-port' -ErrorAction SilentlyContinue
New-NetFirewallRule -Name 'ssh-port' -DisplayName 'SSH (OpenSSH)' -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22

# Get IP address
Write-Host "`nSSH is now ready!" -ForegroundColor Green
Write-Host "Your computer can be accessed via SSH at:" -ForegroundColor Cyan

Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -notlike '127.0.0.1' | ForEach-Object {
    Write-Host "  ssh $env:USERNAME@$($_.IPAddress)" -ForegroundColor White
}

Write-Host "`nSSH service status:" -ForegroundColor Cyan
Get-Service sshd | Format-List


