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

log "🔧 Исправляем PM2 с правильными расширениями файлов..."

# Переходим в рабочую директорию
cd /var/www/helpsmp.ru

# Проверяем package.json
log "🔍 Проверяем package.json..."
if [ -f "package.json" ]; then
    log "✅ Файл package.json найден"
    if grep -q '"type": "module"' package.json; then
        log "⚠️ package.json содержит type: module - используем .cjs расширения"
        USE_CJS=true
    else
        log "✅ package.json не содержит type: module - используем .js расширения"
        USE_CJS=false
    fi
else
    log "❌ Файл package.json не найден!"
    exit 1
fi

# Создаем простой index.js
log "🔧 Создаем простой index.js..."
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

# Устанавливаем права
chmod +x index.js

# Останавливаем PM2
log "🛑 Останавливаем PM2..."
pm2 stop smp-help 2>/dev/null || true
pm2 delete smp-help 2>/dev/null || true

# Создаем конфигурацию PM2 с правильным расширением
if [ "$USE_CJS" = true ]; then
    log "⚙️ Создаем конфигурацию PM2 с расширением .cjs..."
    cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'smp-help',
    script: './index.js',
    cwd: '/var/www/helpsmp.ru',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF
    CONFIG_FILE="ecosystem.config.cjs"
else
    log "⚙️ Создаем конфигурацию PM2 с расширением .js..."
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
      PORT: 3000
    }
  }]
};
EOF
    CONFIG_FILE="ecosystem.config.js"
fi

# Запускаем PM2
log "🚀 Запускаем PM2 с конфигурацией $CONFIG_FILE..."
pm2 start $CONFIG_FILE

# Ждем
sleep 3

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

log "✅ Исправление PM2 завершено!"
log "🌐 Проверьте сайт: https://helpsmp.ru"
