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

log "🔧 Полная диагностика и исправление SMP Help..."

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

# 2. Проверяем .output директорию
log "🔍 2. Проверяем .output директорию..."
if [ -d ".output" ]; then
    log "✅ Директория .output найдена"
    ls -la .output/
    
    if [ -d ".output/server" ]; then
        log "✅ Директория .output/server найдена"
        ls -la .output/server/
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

# 3. Проверяем статические файлы
log "🔍 3. Проверяем статические файлы..."
if [ -d "_nuxt" ]; then
    log "✅ Директория _nuxt найдена"
    ls -la _nuxt/ | head -5
else
    log "❌ Директория _nuxt не найдена!"
fi

# 4. Ищем файлы для запуска
log "🔍 4. Ищем файлы для запуска..."
FOUND_FILES=""

# Проверяем различные варианты
if [ -f "index.mjs" ]; then
    FOUND_FILES="$FOUND_FILES index.mjs"
    log "✅ Найден index.mjs"
fi

if [ -f "index.js" ]; then
    FOUND_FILES="$FOUND_FILES index.js"
    log "✅ Найден index.js"
fi

if [ -f ".output/server/index.mjs" ]; then
    FOUND_FILES="$FOUND_FILES .output/server/index.mjs"
    log "✅ Найден .output/server/index.mjs"
fi

if [ -f ".output/server/index.js" ]; then
    FOUND_FILES="$FOUND_FILES .output/server/index.js"
    log "✅ Найден .output/server/index.js"
fi

if [ -f "node_modules/.bin/nitro" ]; then
    FOUND_FILES="$FOUND_FILES node_modules/.bin/nitro"
    log "✅ Найден node_modules/.bin/nitro"
fi

log "📋 Найденные файлы: $FOUND_FILES"

# 5. Выбираем файл для запуска
MAIN_FILE=""
if [ -f "index.mjs" ]; then
    MAIN_FILE="index.mjs"
elif [ -f ".output/server/index.mjs" ]; then
    MAIN_FILE=".output/server/index.mjs"
elif [ -f "index.js" ]; then
    MAIN_FILE="index.js"
elif [ -f ".output/server/index.js" ]; then
    MAIN_FILE=".output/server/index.js"
elif [ -f "node_modules/.bin/nitro" ]; then
    MAIN_FILE="node_modules/.bin/nitro"
else
    log "❌ Не удалось найти файл для запуска!"
    log "🔍 Доступные файлы:"
    find . -maxdepth 2 -name "*.mjs" -o -name "*.js" | head -10
    exit 1
fi

log "✅ Выбран файл для запуска: $MAIN_FILE"

# 6. Проверяем права на файл
log "🔍 6. Проверяем права на $MAIN_FILE..."
ls -la "$MAIN_FILE"

# 7. Устанавливаем права выполнения
log "🔧 7. Устанавливаем права выполнения..."
chmod +x "$MAIN_FILE"

# 8. Проверяем PM2
log "🔍 8. Проверяем PM2..."
pm2 status

# 9. Останавливаем PM2
log "🛑 9. Останавливаем PM2..."
pm2 stop smp-help 2>/dev/null || true
pm2 delete smp-help 2>/dev/null || true

# 10. Создаем конфигурацию PM2
log "⚙️ 10. Создаем конфигурацию PM2..."
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

# Обновляем путь к файлу в конфигурации
sed -i "s|script: './index.mjs'|script: './$MAIN_FILE'|g" ecosystem.config.mjs

# Устанавливаем права на конфигурацию
chmod 644 ecosystem.config.mjs

# 11. Проверяем, что файл существует
if [ ! -f "$MAIN_FILE" ]; then
    log "❌ Файл $MAIN_FILE не найден!"
    exit 1
fi

# 12. Проверяем, что файл исполняемый
if [ ! -x "$MAIN_FILE" ]; then
    log "❌ Файл $MAIN_FILE не исполняемый!"
    exit 1
fi

# 13. Запускаем PM2
log "🚀 13. Запускаем PM2 с файлом $MAIN_FILE..."
pm2 start ecosystem.config.mjs

# 14. Ждем немного
log "⏳ 14. Ждем запуска..."
sleep 5

# 15. Проверяем статус
log "🔍 15. Проверяем статус PM2..."
pm2 status

# 16. Проверяем логи
log "📋 16. Проверяем логи..."
pm2 logs smp-help --lines 10

# 17. Проверяем, слушает ли порт
log "🔍 17. Проверяем порт 3000..."
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp | grep :3000 || echo "Порт 3000 не слушается"
elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :3000 || echo "Порт 3000 не слушается"
else
    echo "netstat и ss не найдены, проверяем через lsof..."
    lsof -i :3000 || echo "Порт 3000 не слушается"
fi

# 18. Проверяем статические файлы
log "🔍 18. Проверяем статические файлы..."
if [ -d "_nuxt" ]; then
    log "✅ Директория _nuxt найдена"
    ls -la _nuxt/ | head -5
else
    log "❌ Директория _nuxt не найдена!"
fi

# 19. Проверяем доступность сайта
log "🌐 19. Проверяем доступность сайта..."
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

# 20. Проверяем MongoDB
log "🔍 20. Проверяем MongoDB..."
if systemctl is-active --quiet mongod; then
    log "✅ MongoDB работает"
else
    log "❌ MongoDB не работает"
fi

# 21. Проверяем Nginx
log "🔍 21. Проверяем Nginx..."
if systemctl is-active --quiet nginx; then
    log "✅ Nginx работает"
else
    log "❌ Nginx не работает"
fi

log "✅ Полная диагностика завершена!"
log "🌐 Проверьте сайт: https://helpsmp.ru"
log "📋 Полезные команды:"
log "  - Статус: pm2 status"
log "  - Логи: pm2 logs smp-help"
log "  - Перезапуск: pm2 restart smp-help"
log "  - Остановка: pm2 stop smp-help"
log "  - Удаление: pm2 delete smp-help"
