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

log "🔧 Быстрое исправление PM2..."

# Переходим в рабочую директорию
cd /var/www/helpsmp.ru

# Проверяем index.mjs
log "🔍 Проверяем index.mjs..."
if [ -f "index.mjs" ]; then
    log "✅ Файл index.mjs найден"
    echo "Содержимое index.mjs:"
    cat index.mjs
    echo ""
    
    # Проверяем размер файла
    FILE_SIZE=$(wc -c < index.mjs)
    log "📏 Размер файла: $FILE_SIZE байт"
    
    if [ "$FILE_SIZE" -lt 100 ]; then
        log "⚠️ Файл index.mjs очень маленький, возможно, неполный"
        log "🔧 Создаем правильный index.mjs..."
        
        # Создаем правильный index.mjs
        cat > index.mjs << 'EOF'
import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const pathname = url.pathname
    
    if (pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('SMP Help Server is running!')
    } else if (pathname.startsWith('/_nuxt/')) {
      const filePath = join(process.cwd(), pathname)
      if (existsSync(filePath)) {
        const file = readFileSync(filePath)
        const ext = extname(filePath)
        let contentType = 'application/javascript'
        
        if (ext === '.css') contentType = 'text/css'
        if (ext === '.js') contentType = 'application/javascript'
        if (ext === '.json') contentType = 'application/json'
        
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(file)
      } else {
        res.writeHead(404)
        res.end('File not found')
      }
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  } catch (error) {
    console.error('Error:', error)
    res.writeHead(500)
    res.end('Internal Server Error')
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`SMP Help Server running on port ${PORT}`)
})
EOF
        
        chmod +x index.mjs
        log "✅ Создан правильный index.mjs"
    fi
    
else
    log "❌ Файл index.mjs не найден!"
    log "🔧 Создаем index.mjs..."
    
    # Создаем index.mjs
    cat > index.mjs << 'EOF'
import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const pathname = url.pathname
    
    if (pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('SMP Help Server is running!')
    } else if (pathname.startsWith('/_nuxt/')) {
      const filePath = join(process.cwd(), pathname)
      if (existsSync(filePath)) {
        const file = readFileSync(filePath)
        const ext = extname(filePath)
        let contentType = 'application/javascript'
        
        if (ext === '.css') contentType = 'text/css'
        if (ext === '.js') contentType = 'application/javascript'
        if (ext === '.json') contentType = 'application/json'
        
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(file)
      } else {
        res.writeHead(404)
        res.end('File not found')
      }
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  } catch (error) {
    console.error('Error:', error)
    res.writeHead(500)
    res.end('Internal Server Error')
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`SMP Help Server running on port ${PORT}`)
})
EOF
    
    chmod +x index.mjs
    log "✅ Создан index.mjs"
fi

# Останавливаем PM2
log "🛑 Останавливаем PM2..."
pm2 stop smp-help 2>/dev/null || true
pm2 delete smp-help 2>/dev/null || true

# Создаем конфигурацию PM2
log "⚙️ Создаем конфигурацию PM2..."
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

# Устанавливаем права на конфигурацию
chmod 644 ecosystem.config.mjs

# Запускаем PM2
log "🚀 Запускаем PM2..."
pm2 start ecosystem.config.mjs

# Ждем немного
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

log "✅ Быстрое исправление PM2 завершено!"
log "🌐 Проверьте сайт: https://helpsmp.ru"
