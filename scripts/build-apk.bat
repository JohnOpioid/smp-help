@echo off
REM Скрипт для сборки APK через Android Studio
echo 🚀 Подготовка к сборке APK...

echo 📱 Открываем проект в Android Studio...
npm run cap:android

echo.
echo 📋 Инструкция по сборке APK:
echo.
echo 1. Дождитесь загрузки проекта в Android Studio
echo 2. Build → Generate Signed Bundle / APK...
echo 3. Выберите APK
echo 4. Создайте новый ключ или используйте существующий
echo 5. Выберите Build Variants: release
echo 6. Нажмите Create
echo.
echo ⏱️ Сборка займет 2-5 минут
echo 📁 APK будет в выбранной папке
echo.
echo 🔑 Для создания нового ключа используйте:
echo    Key store path: smp-help-key.jks
echo    Password: ваш_надежный_пароль
echo    Key alias: smp-help-key
echo    Validity: 25 лет
echo.
echo ✅ После сборки APK готов к установке!
