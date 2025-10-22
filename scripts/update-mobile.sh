#!/bin/bash

# Скрипт для быстрого обновления мобильного приложения под продакшен
# Использование: ./scripts/update-mobile.sh your-domain.com

if [ -z "$1" ]; then
    echo "❌ Ошибка: Укажите домен продакшена"
    echo "Использование: $0 your-domain.com"
    echo "Пример: $0 smp-help.ru"
    exit 1
fi

DOMAIN=$1

echo "🚀 Обновляем мобильное приложение для продакшена..."
echo "🌐 Домен: $DOMAIN"

# Обновляем capacitor.config.ts
echo "📝 Обновляем Capacitor конфигурацию..."
sed -i "s/https:\/\/your-production-domain.com/https:\/\/$DOMAIN/g" capacitor.config.ts

# Собираем приложение для продакшена
echo "🔨 Собираем приложение для продакшена..."
npm run build:production

# Синхронизируем с Capacitor
echo "📱 Синхронизируем с Capacitor..."
npm run cap:sync

echo "✅ Обновление завершено!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Откройте проект в Android Studio: npm run cap:android"
echo "2. Соберите APK для продакшена"
echo "3. Протестируйте приложение с продакшен БД"
echo ""
echo "🔗 Приложение будет подключаться к: https://$DOMAIN"
echo "🗄️ База данных: mongodb://help-smp-user:***@185.185.68.107:27017/"
