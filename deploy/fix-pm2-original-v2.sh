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

log "🔧 Исправляем PM2 для работы с оригинальным сервером..."

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

# Создаем конфигурацию PM2 для ES модулей БЕЗ experimental-modules
log "⚙️ Создаем конфигурацию PM2 для ES модулей..."
cat > ecosystem.config.mjs << 'EOF'
export default {
  apps: [{
    name: 'smp-help',
    script: './index.mjs',
    cwd: '/var/www/helpsmp.ru',
    instances: 1,
    exec_mode: 'fork',
    interpreter: 'node',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NUXT_PUBLIC_API_BASE_URL: 'https://helpsmp.ru/api',
      NUXT_PUBLIC_APP_URL: 'https://helpsmp.ru',
      MONGODB_URI: 'mongodb://localhost:27017/smp-help',
      JWT_SECRET: 'your-jwt-secret-here',
      ADMIN_SETUP_TOKEN: 'your-admin-token-here',
      GIGACHAT_API_KEY: 'your-gigachat-key-here',
      GIGACHAT_API_URL: 'https://gigachat.devices.sberbank.ru/api/v1',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: 587,
      SMTP_USER: 'your-email@gmail.com',
      SMTP_PASS: 'your-email-password'
    },
    log_file: '/var/log/pm2/smp-help.log',
    out_file: '/var/log/pm2/smp-help-out.log',
    error_file: '/var/log/pm2/smp-help-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF

# Проверяем, что файлы созданы
log "🔍 Проверяем созданные файлы..."
if [ -f "index.mjs" ] && [ -f "ecosystem.config.mjs" ]; then
    log "✅ Файлы index.mjs и ecosystem.config.mjs созданы"
else
    error "❌ Файлы не созданы!"
    exit 1
fi

# Попробуем запустить файл напрямую
log "🧪 Тестируем запуск index.mjs напрямую..."
if timeout 10s node index.mjs; then
    log "✅ index.mjs запускается напрямую"
else
    log "⚠️ index.mjs не запускается напрямую или требует времени"
fi

# Запускаем PM2
log "🚀 Запускаем PM2 с оригинальным сервером..."
pm2 start ecosystem.config.mjs

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

log "✅ Исправление PM2 завершено!"
log "🌐 Проверьте сайт: https://helpsmp.ru"
