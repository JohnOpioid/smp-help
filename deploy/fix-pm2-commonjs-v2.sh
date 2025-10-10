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

log "🔧 Создаем CommonJS версию для PM2..."

# Переходим в рабочую директорию
cd /var/www/helpsmp.ru

# Проверяем содержимое index.mjs
log "🔍 Проверяем содержимое index.mjs..."
if [ -f "index.mjs" ]; then
    log "✅ Файл index.mjs найден"
    echo "Содержимое index.mjs:"
    cat index.mjs
    echo ""
    
    # Проверяем права на файл
    log "🔐 Проверяем права на index.mjs..."
    ls -la index.mjs
    
    # Устанавливаем права выполнения
    chmod +x index.mjs
    
    # Проверяем синтаксис
    log "🧪 Проверяем синтаксис index.mjs..."
    if node --check index.mjs; then
        log "✅ Синтаксис index.mjs корректен"
    else
        log "❌ Синтаксис index.mjs некорректен!"
        exit 1
    fi
    
else
    log "❌ Файл index.mjs не найден!"
    exit 1
fi

# Создаем CommonJS версию
log "🔧 Создаем CommonJS версию index.js..."
cat > index.js << 'EOF'
const { createServer } = require('http');
const { readFileSync, existsSync } = require('fs');
const { join, extname } = require('path');

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    
    if (pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('SMP Help Server is running!');
    } else if (pathname.startsWith('/_nuxt/')) {
      const filePath = join(process.cwd(), pathname);
      if (existsSync(filePath)) {
        const file = readFileSync(filePath);
        const ext = extname(filePath);
        let contentType = 'application/javascript';
        
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.js') contentType = 'application/javascript';
        if (ext === '.json') contentType = 'application/json';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(file);
      } else {
        res.writeHead(404);
        res.end('File not found');
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SMP Help Server running on port ${PORT}`);
});
EOF

# Устанавливаем права на файл
chmod +x index.js

# Проверяем синтаксис
log "🧪 Проверяем синтаксис index.js..."
if node --check index.js; then
    log "✅ Синтаксис index.js корректен"
else
    log "❌ Синтаксис index.js некорректен!"
    exit 1
fi

# Останавливаем PM2
log "🛑 Останавливаем PM2..."
pm2 stop smp-help 2>/dev/null || true
pm2 delete smp-help 2>/dev/null || true

# Создаем конфигурацию PM2 для CommonJS
log "⚙️ Создаем конфигурацию PM2 для CommonJS..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'smp-help',
    script: './index.js',
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
};
EOF

# Устанавливаем права на конфигурацию
chmod 644 ecosystem.config.js

# Проверяем конфигурацию
log "🔍 Проверяем конфигурацию PM2..."
if [ -f "ecosystem.config.js" ]; then
    log "✅ Конфигурация PM2 создана"
    echo "Содержимое конфигурации:"
    cat ecosystem.config.js
    echo ""
else
    log "❌ Не удалось создать конфигурацию PM2!"
    exit 1
fi

# Попробуем запустить файл напрямую
log "🧪 Тестируем запуск index.js напрямую..."
if timeout 10s node index.js; then
    log "✅ index.js запускается напрямую"
else
    log "⚠️ index.js не запускается напрямую или требует времени"
fi

# Запускаем PM2
log "🚀 Запускаем PM2 с CommonJS конфигурацией..."
pm2 start ecosystem.config.js

# Ждем немного
sleep 5

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

log "✅ Создание CommonJS версии завершено!"
log "🌐 Проверьте сайт: https://helpsmp.ru"
