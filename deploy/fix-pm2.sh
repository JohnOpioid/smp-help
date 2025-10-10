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

log "🔧 Исправляем проблему с PM2..."

# Переходим в рабочую директорию
cd /var/www/helpsmp.ru

# Проверяем, что находится в директории
log "📁 Проверяем содержимое рабочей директории..."
ls -la

# Проверяем, есть ли index.mjs
if [ ! -f "index.mjs" ]; then
    log "❌ Файл index.mjs не найден!"
    log "🔍 Ищем файлы .mjs..."
    find . -name "*.mjs" -type f
    
    log "🔍 Ищем файлы .js..."
    find . -name "*.js" -type f
    
    log "🔍 Ищем файлы в корне..."
    ls -la *.mjs 2>/dev/null || echo "Нет .mjs файлов"
    ls -la *.js 2>/dev/null || echo "Нет .js файлов"
    
    # Проверяем, есть ли файлы в .output
    if [ -d ".output" ]; then
        log "📁 Проверяем .output директорию..."
        find .output -name "*.mjs" -o -name "*.js" | head -10
    fi
    
    # Проверяем, есть ли файлы в node_modules/.bin
    if [ -d "node_modules/.bin" ]; then
        log "📁 Проверяем node_modules/.bin..."
        ls -la node_modules/.bin/ | grep -E "(nuxt|nitro)"
    fi
    
    log "❌ Не удалось найти файл для запуска!"
    exit 1
fi

# Проверяем права на файл
log "🔐 Проверяем права на index.mjs..."
ls -la index.mjs

# Устанавливаем права выполнения
chmod +x index.mjs

# Проверяем, что файл исполняемый
if [ ! -x "index.mjs" ]; then
    log "❌ Файл index.mjs не исполняемый!"
    exit 1
fi

# Останавливаем PM2
log "🛑 Останавливаем PM2..."
pm2 stop smp-help 2>/dev/null || true
pm2 delete smp-help 2>/dev/null || true

# Создаем правильную конфигурацию PM2
log "⚙️ Создаем конфигурацию PM2..."
cat > ecosystem.config.mjs << 'EOF'
export default {
  apps: [{
    name: 'smp-help',
    script: './index.mjs',
    cwd: '/var/www/helpsmp.ru',
    instances: 1,
    exec_mode: 'fork',
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

# Устанавливаем права на конфигурацию
chmod 644 ecosystem.config.mjs

# Запускаем PM2
log "🚀 Запускаем PM2 с новой конфигурацией..."
pm2 start ecosystem.config.mjs

# Проверяем статус
log "🔍 Проверяем статус PM2..."
pm2 status

# Проверяем логи
log "📋 Проверяем логи..."
pm2 logs smp-help --lines 10

# Проверяем, слушает ли порт
log "🔍 Проверяем порт 3000..."
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp | grep :3000 || echo "Порт 3000 не слушается"
elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :3000 || echo "Порт 3000 не слушается"
else
    echo "netstat и ss не найдены, проверяем через lsof..."
    lsof -i :3000 || echo "Порт 3000 не слушается"
fi

# Проверяем статические файлы
log "📁 Проверяем статические файлы..."
if [ -d "_nuxt" ]; then
    log "✅ Директория _nuxt найдена"
    ls -la _nuxt/ | head -5
else
    log "❌ Директория _nuxt не найдена!"
fi

log "✅ Исправление PM2 завершено!"
log "🌐 Проверьте сайт: https://helpsmp.ru"
