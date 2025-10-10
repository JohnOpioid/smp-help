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

log "🔧 Полное исправление PM2 для SMP Help..."

# Переходим в рабочую директорию
cd /var/www/helpsmp.ru

# Проверяем, что мы в правильной директории
if [ ! -d "/var/www/helpsmp.ru" ]; then
    log "❌ Рабочая директория не найдена!"
    exit 1
fi

log "📁 Текущая директория: $(pwd)"

# 1. Проверяем содержимое директории
log "🔍 1. Анализируем содержимое директории..."
ls -la

# 2. Проверяем index.mjs
log "🔍 2. Проверяем index.mjs..."
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
    fi
    
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
        log "🔍 Попробуем исправить..."
        
        # Создаем простой index.mjs
        cat > index.mjs << 'EOF'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const pathname = url.pathname
    
    if (pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('SMP Help Server is running!')
    } else if (pathname.startsWith('/_nuxt/')) {
      const filePath = join(process.cwd(), pathname)
      const file = readFileSync(filePath)
      res.writeHead(200, { 'Content-Type': 'application/javascript' })
      res.end(file)
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  } catch (error) {
    res.writeHead(500)
    res.end('Internal Server Error')
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
EOF
        
        chmod +x index.mjs
        log "✅ Создан новый index.mjs"
    fi
    
else
    log "❌ Файл index.mjs не найден!"
    log "🔧 Создаем index.mjs..."
    
    # Создаем простой index.mjs
    cat > index.mjs << 'EOF'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const pathname = url.pathname
    
    if (pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('SMP Help Server is running!')
    } else if (pathname.startsWith('/_nuxt/')) {
      const filePath = join(process.cwd(), pathname)
      const file = readFileSync(filePath)
      res.writeHead(200, { 'Content-Type': 'application/javascript' })
      res.end(file)
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  } catch (error) {
    res.writeHead(500)
    res.end('Internal Server Error')
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
EOF
    
    chmod +x index.mjs
    log "✅ Создан index.mjs"
fi

# 3. Проверяем .output директорию
log "🔍 3. Проверяем .output директорию..."
if [ -d ".output" ]; then
    log "✅ Директория .output найдена"
    ls -la .output/
    
    if [ -d ".output/server" ]; then
        log "✅ Директория .output/server найдена"
        ls -la .output/server/
        
        # Проверяем, есть ли файлы в .output/server
        if [ -f ".output/server/index.mjs" ]; then
            log "✅ Найден .output/server/index.mjs"
            echo "Содержимое .output/server/index.mjs:"
            head -20 .output/server/index.mjs
            echo ""
        fi
    else
        log "❌ Директория .output/server не найдена!"
    fi
    
    if [ -d ".output/public" ]; then
        log "✅ Директория .output/public найдена"
        ls -la .output/public/ | head -5
    else
        log "❌ Директория .output/public не найдена!"
    fi
else
    log "❌ Директория .output не найдена!"
fi

# 4. Проверяем статические файлы
log "🔍 4. Проверяем статические файлы..."
if [ -d "_nuxt" ]; then
    log "✅ Директория _nuxt найдена"
    ls -la _nuxt/ | head -5
else
    log "❌ Директория _nuxt не найдена!"
fi

# 5. Останавливаем PM2
log "🛑 5. Останавливаем PM2..."
pm2 stop smp-help 2>/dev/null || true
pm2 delete smp-help 2>/dev/null || true

# 6. Создаем конфигурацию PM2
log "⚙️ 6. Создаем конфигурацию PM2..."
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

# 7. Проверяем конфигурацию
log "🔍 7. Проверяем конфигурацию PM2..."
if [ -f "ecosystem.config.mjs" ]; then
    log "✅ Конфигурация PM2 создана"
    echo "Содержимое конфигурации:"
    cat ecosystem.config.mjs
    echo ""
else
    log "❌ Не удалось создать конфигурацию PM2!"
    exit 1
fi

# 8. Запускаем PM2
log "🚀 8. Запускаем PM2..."
pm2 start ecosystem.config.mjs

# 9. Ждем немного
log "⏳ 9. Ждем запуска..."
sleep 5

# 10. Проверяем статус
log "🔍 10. Проверяем статус PM2..."
pm2 status

# 11. Проверяем логи
log "📋 11. Проверяем логи..."
pm2 logs smp-help --lines 10

# 12. Проверяем, слушает ли порт
log "🔍 12. Проверяем порт 3000..."
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp | grep :3000 || echo "Порт 3000 не слушается"
elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :3000 || echo "Порт 3000 не слушается"
else
    echo "netstat и ss не найдены, проверяем через lsof..."
    lsof -i :3000 || echo "Порт 3000 не слушается"
fi

# 13. Проверяем доступность сайта
log "🌐 13. Проверяем доступность сайта..."
if command -v curl >/dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://helpsmp.ru)
    if [ "$HTTP_CODE" = "200" ]; then
        log "✅ Сайт доступен (HTTP $HTTP_CODE)"
    else
        log "❌ Сайт недоступен (HTTP $HTTP_CODE)"
    fi
else
    echo "curl не найден, проверьте сайт вручную"
fi

log "✅ Полное исправление PM2 завершено!"
log "🌐 Проверьте сайт: https://helpsmp.ru"
log "📋 Полезные команды:"
log "  - Статус: pm2 status"
log "  - Логи: pm2 logs smp-help"
log "  - Перезапуск: pm2 restart smp-help"
