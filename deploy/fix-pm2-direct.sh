#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция логирования
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Функция ошибки
error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

log "🔧 Альтернативное исправление PM2..."

# Переходим в рабочую директорию
cd /var/www/helpsmp.ru

# Проверяем, есть ли оригинальный index.mjs
log "🔍 Проверяем оригинальный index.mjs..."
if [ -f "index.mjs" ]; then
    log "✅ Оригинальный index.mjs найден"
    
    # Проверяем права
    chmod +x index.mjs
    
    # Проверяем синтаксис
    if node --check index.mjs; then
        log "✅ Синтаксис index.mjs корректен"
    else
        log "❌ Синтаксис index.mjs некорректен!"
        exit 1
    fi
else
    error "❌ Оригинальный index.mjs не найден!"
    exit 1
fi

# Останавливаем PM2
log "🛑 Останавливаем PM2..."
pm2 stop smp-help 2>/dev/null || true
pm2 delete smp-help 2>/dev/null || true

# Удаляем старые файлы
log "🗑️ Удаляем старые файлы..."
rm -f index.cjs
rm -f index.js
rm -f ecosystem.config.cjs
rm -f ecosystem.config.js
rm -f ecosystem.config.mjs

# Попробуем запустить файл напрямую через PM2
log "🚀 Запускаем PM2 напрямую с index.mjs..."
pm2 start index.mjs --name smp-help --env production

# Ждем
sleep 5

# Проверяем статус
log "🔍 Проверяем статус PM2..."
pm2 status

# Проверяем логи
log "📋 Проверяем логи..."
pm2 logs smp-help --lines 10

# Проверяем порт
log "🔍 Проверяем порт 3000..."
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp | grep :3000 || echo "Порт 3000 не слушается"
elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :3000 || echo "Порт 3000 не слушается"
else
    echo "netstat и ss не найдены, проверяем через lsof..."
    lsof -i :3000 || echo "Порт 3000 не слушается"
fi

# Тестируем маршруты
log "🧪 Тестируем маршруты..."
if command -v curl >/dev/null 2>&1; then
    log "Тестируем корневой маршрут:"
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "Ошибка"
    
    log "Тестируем маршрут /auth/login:"
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login || echo "Ошибка"
else
    log "⚠️ curl не найден, проверьте маршруты вручную"
fi

log "✅ Альтернативное исправление PM2 завершено!"
log "🌐 Проверьте сайт: https://helpsmp.ru"
