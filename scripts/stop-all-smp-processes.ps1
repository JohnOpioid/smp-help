# Останавливает все процессы, связанные с SMP Help App

Write-Host "Остановка всех процессов SMP Help..." -ForegroundColor Yellow
Write-Host ""

# Останавливаем все процессы Node.js, запущенные в smp-help
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine
    if ($cmdLine -like "*smp-help*" -or $cmdLine -like "*nuxt dev*") {
        Write-Host "Останавливаем процесс Node.js: $($_.Id)" -ForegroundColor Cyan
        Stop-Process -Id $_.Id -Force
    }
}

Write-Host "✅ Все процессы Node.js остановлены" -ForegroundColor Green

# Останавливаем все процессы PowerShell, связанные с SMP
Get-Process powershell -ErrorAction SilentlyContinue | ForEach-Object {
    $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine
    if ($cmdLine -like "*smp-help*" -or $cmdLine -like "*SMP Help*") {
        Write-Host "Останавливаем процесс PowerShell: $($_.Id)" -ForegroundColor Cyan
        Stop-Process -Id $_.Id -Force
    }
}

Write-Host "✅ Все процессы PowerShell остановлены" -ForegroundColor Green

# Останавливаем процессы pwsh
Get-Process pwsh -ErrorAction SilentlyContinue | ForEach-Object {
    $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine
    if ($cmdLine -like "*smp-help*" -or $cmdLine -like "*SMP Help*") {
        Write-Host "Останавливаем процесс pwsh: $($_.Id)" -ForegroundColor Cyan
        Stop-Process -Id $_.Id -Force
    }
}

Write-Host "✅ Все процессы pwsh остановлены" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  ПЕРЕЗАГРУЗИТЕ КОМПЬЮТЕР, если окна продолжают появляться!" -ForegroundColor Red
Write-Host ""


