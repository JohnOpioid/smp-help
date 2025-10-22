@echo off
REM Скрипт для быстрого обновления мобильного приложения под продакшен (Windows)
REM Использование: update-mobile.bat your-domain.com

if "%1"=="" (
    echo ❌ Ошибка: Укажите домен продакшена
    echo Использование: %0 your-domain.com
    echo Пример: %0 smp-help.ru
    exit /b 1
)

set DOMAIN=%1

echo 🚀 Обновляем мобильное приложение для продакшена...
echo 🌐 Домен: %DOMAIN%

REM Обновляем capacitor.config.ts
echo 📝 Обновляем Capacitor конфигурацию...
powershell -Command "(Get-Content capacitor.config.ts) -replace 'https://your-production-domain.com', 'https://%DOMAIN%' | Set-Content capacitor.config.ts"

REM Собираем приложение для продакшена
echo 🔨 Собираем приложение для продакшена...
npm run build:production

REM Синхронизируем с Capacitor
echo 📱 Синхронизируем с Capacitor...
npm run cap:sync

echo ✅ Обновление завершено!
echo.
echo 📋 Следующие шаги:
echo 1. Откройте проект в Android Studio: npm run cap:android
echo 2. Соберите APK для продакшена
echo 3. Протестируйте приложение с продакшен БД
echo.
echo 🔗 Приложение будет подключаться к: https://%DOMAIN%
echo 🗄️ База данных: mongodb://help-smp-user:***@185.185.68.107:27017/
