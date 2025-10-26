# Quick SSH Status Check Script
# Run this to check if SSH is working

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   SSH Status Check" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check if SSH service is running
Write-Host "`n[1] SSH Service Status:" -ForegroundColor Yellow
$sshService = Get-Service sshd -ErrorAction SilentlyContinue

if ($sshService) {
    Write-Host "  Status: $($sshService.Status)" -ForegroundColor $(if ($sshService.Status -eq 'Running') { 'Green' } else { 'Red' })
    Write-Host "  Startup Type: $($sshService.StartType)" -ForegroundColor Cyan
} else {
    Write-Host "  SSH service is not installed!" -ForegroundColor Red
}

# Check if port 22 is listening
Write-Host "`n[2] Port 22 Status:" -ForegroundColor Yellow
$port22 = netstat -an | findstr :22

if ($port22) {
    Write-Host "  Port 22 is listening:" -ForegroundColor Green
    Write-Host $port22 -ForegroundColor White
} else {
    Write-Host "  Port 22 is not listening!" -ForegroundColor Red
}

# Check firewall rules
Write-Host "`n[3] Firewall Rules:" -ForegroundColor Yellow
$firewallRule = Get-NetFirewallRule -Name 'ssh-port' -ErrorAction SilentlyContinue

if ($firewallRule) {
    Write-Host "  Firewall rule 'ssh-port' exists" -ForegroundColor Green
} else {
    Write-Host "  No firewall rule found for SSH" -ForegroundColor Yellow
    Write-Host "  You may need to allow port 22 in Windows Firewall" -ForegroundColor Yellow
}

# Get network IPs
Write-Host "`n[4] Network Information:" -ForegroundColor Yellow
$networkInfo = Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -notlike '127.0.0.1' | Select-Object IPAddress, InterfaceAlias, PrefixLength

if ($networkInfo) {
    Write-Host "  Your computer can be accessed via SSH at:" -ForegroundColor Cyan
    foreach ($info in $networkInfo) {
        Write-Host "    ssh username@$($info.IPAddress)/$($info.PrefixLength)" -ForegroundColor White
        Write-Host "      Interface: $($info.InterfaceAlias)" -ForegroundColor Gray
    }
} else {
    Write-Host "  No network adapters found" -ForegroundColor Red
}

# Check recent SSH logs
Write-Host "`n[5] Recent SSH Activity:" -ForegroundColor Yellow
try {
    $recentLogs = Get-EventLog -LogName Application -Source 'OpenSSH*' -Newest 5 -ErrorAction SilentlyContinue
    
    if ($recentLogs) {
        Write-Host "  Last 5 SSH events:" -ForegroundColor Cyan
        $recentLogs | ForEach-Object {
            $time = $_.TimeGenerated.ToString("yyyy-MM-dd HH:mm:ss")
            $entryType = $_.EntryType
            $message = $_.Message -replace "`n", " " | Select-Object -First 50
            
            Write-Host "    [$time] [$entryType] $message" -ForegroundColor White
        }
    } else {
        Write-Host "  No recent SSH activity found" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Could not retrieve SSH logs" -ForegroundColor Yellow
}

# Summary
Write-Host "`n============================================" -ForegroundColor $(if ($sshService.Status -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "   Quick Fixes:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor $(if ($sshService.Status -eq 'Running') { 'Green' } else { 'Red' })

if ($sshService.Status -ne 'Running') {
    Write-Host "1. Start SSH service:" -ForegroundColor Yellow
    Write-Host "   Start-Service sshd" -ForegroundColor White
}

if (-not $firewallRule) {
    Write-Host "2. Add firewall rule:" -ForegroundColor Yellow
    Write-Host "   New-NetFirewallRule -Name 'ssh-port' -DisplayName 'SSH' -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22" -ForegroundColor White
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


