# Скрипт для остановки лишних процессов Cursor и PowerShell

Write-Host "Остановка лишних процессов..." -ForegroundColor Yellow

# Останавливаем лишние процессы PowerShell (кроме текущего)
$currentPid = $PID
$powershellProcesses = Get-Process powershell -ErrorAction SilentlyContinue | Where-Object {$_.Id -ne $currentPid}

if ($powershellProcesses) {
    Write-Host "Остановка $($powershellProcesses.Count) процессов PowerShell..." -ForegroundColor Cyan
    $powershellProcesses | Stop-Process -Force
    Write-Host "✅ Процессы PowerShell остановлены" -ForegroundColor Green
} else {
    Write-Host "✅ Нет лишних процессов PowerShell" -ForegroundColor Green
}

# Останавливаем процессы pwsh (PowerShell 7) кроме текущего
$pwshProcesses = Get-Process pwsh -ErrorAction SilentlyContinue | Where-Object {$_.Id -ne $currentPid}
if ($pwshProcesses) {
    Write-Host "Остановка $($pwshProcesses.Count) процессов pwsh..." -ForegroundColor Cyan
    $pwshProcesses | Stop-Process -Force
    Write-Host "✅ Процессы pwsh остановлены" -ForegroundColor Green
} else {
    Write-Host "✅ Нет лишних процессов pwsh" -ForegroundColor Green
}

# Останавливаем процессы Node.js (кроме system)
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.Path -notlike "*Windows*"}
if ($nodeProcesses) {
    Write-Host "Остановка $($nodeProcesses.Count) процессов Node.js..." -ForegroundColor Cyan
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Процессы Node.js остановлены" -ForegroundColor Green
} else {
    Write-Host "✅ Нет лишних процессов Node.js" -ForegroundColor Green
}

Write-Host "" -ForegroundColor Green
Write-Host "Готово! Перезапустите Cursor, если проблема остается." -ForegroundColor Yellow


