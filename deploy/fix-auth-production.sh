#!/bin/bash

# ИСПРАВЛЕНИЕ АВТОРИЗАЦИИ НА ПРОДАКШЕНЕ
# Запускать от root пользователя

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функции для вывода
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Проверяем, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    error "Этот скрипт должен быть запущен от root пользователя"
    exit 1
fi

# Определяем рабочую директорию
WORK_DIR="/var/www/html/helpsmp.ru"
PROJECT_NAME="smp-help"

log "🔧 ИСПРАВЛЕНИЕ АВТОРИЗАЦИИ НА ПРОДАКШЕНЕ..."

# Проверяем существование рабочей директории
if [ ! -d "$WORK_DIR" ]; then
    error "Рабочая директория не найдена: $WORK_DIR"
    exit 1
fi

cd "$WORK_DIR"

# 1. Проверяем текущую конфигурацию
log "🔍 Проверяем текущую конфигурацию..."
if [ -f "ecosystem.config.cjs" ]; then
    CURRENT_JWT=$(grep "JWT_SECRET:" ecosystem.config.cjs | sed "s/.*JWT_SECRET: '\(.*\)'.*/\1/" | head -1)
    log "📋 Текущий JWT_SECRET: $CURRENT_JWT"
    
    # Проверяем длину JWT_SECRET
    if [ ${#CURRENT_JWT} -lt 32 ]; then
        warn "⚠️ JWT_SECRET слишком короткий (${#CURRENT_JWT} символов), генерируем новый..."
        JWT_SECRET=$(openssl rand -hex 32)
    else
        log "✅ JWT_SECRET имеет достаточную длину"
        JWT_SECRET="$CURRENT_JWT"
    fi
else
    error "Конфигурация PM2 не найдена: $WORK_DIR/ecosystem.config.cjs"
    exit 1
fi

# 2. Обновляем JWT_SECRET в конфигурации PM2
log "⚙️ Обновляем JWT_SECRET в конфигурации PM2..."
sed -i "s|JWT_SECRET: '.*'|JWT_SECRET: '$JWT_SECRET'|g" ecosystem.config.cjs
log "✅ JWT_SECRET обновлен в ecosystem.config.cjs"

# 3. Создаем/обновляем файл .env
log "📝 Создаем/обновляем файл .env..."
cat > .env << EOF
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://helpsmp.ru/api
NUXT_PUBLIC_APP_URL=https://helpsmp.ru
PORT=3000
MONGODB_URI=mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin
JWT_SECRET=$JWT_SECRET
ADMIN_SETUP_TOKEN=your-admin-token-here
GIGACHAT_API_KEY=
GIGACHAT_CLIENT_ID=
GIGACHAT_SCOPE=
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
YAMAPS_API_KEY=0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c
EOF
log "✅ Файл .env создан"

# 4. Удаляем PWA файлы (если есть)
log "🗑️ Удаляем PWA файлы..."
rm -f manifest.webmanifest 2>/dev/null || true
rm -f browserconfig.xml 2>/dev/null || true
rm -rf icons 2>/dev/null || true
log "✅ PWA файлы удалены"

# 5. Устанавливаем права
log "🔐 Устанавливаем права..."
chmod 644 ecosystem.config.cjs .env
chown www-data:www-data ecosystem.config.cjs .env
log "✅ Права установлены"

# 6. Перезапускаем приложение
log "🔄 Перезапускаем приложение..."
pm2 stop "$PROJECT_NAME" 2>/dev/null || true
pm2 delete "$PROJECT_NAME" 2>/dev/null || true
pm2 start "$WORK_DIR/ecosystem.config.cjs"
pm2 save
log "✅ Приложение перезапущено"

# Ждем запуска
sleep 10

# 7. Проверяем результат
log "🔍 Проверяем результат..."

# Проверяем статус PM2
pm2 status

# Проверяем логи
log "📋 Проверяем логи..."
pm2 logs "$PROJECT_NAME" --lines 10

# Проверяем доступность API
log "🌐 Проверяем доступность API..."
if command -v curl >/dev/null 2>&1; then
    API_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://helpsmp.ru/api/auth/login 2>/dev/null)
    if [ "$API_CODE" = "400" ] || [ "$API_CODE" = "401" ]; then
        log "✅ API логина работает (HTTP $API_CODE - ожидаемый код для пустого запроса)"
    else
        warn "⚠️ API логина недоступен (HTTP $API_CODE)"
    fi
else
    warn "⚠️ curl не найден, проверьте API вручную"
fi

# 8. Проверяем MongoDB подключение
log "🗄️ Проверяем MongoDB подключение..."
if command -v mongosh >/dev/null 2>&1; then
    if mongosh --eval "db.runCommand('ping')" mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin >/dev/null 2>&1; then
        log "✅ MongoDB подключение работает"
    else
        warn "⚠️ Проблемы с подключением к MongoDB"
    fi
else
    warn "⚠️ mongosh не найден, проверьте MongoDB вручную"
fi

log "🎉 ИСПРАВЛЕНИЕ АВТОРИЗАЦИИ ЗАВЕРШЕНО!"
log ""
log "📋 Что было сделано:"
log "✅ JWT_SECRET проверен и обновлен"
log "✅ Файл .env создан с правильными настройками"
log "✅ PWA файлы удалены"
log "✅ Права на файлы установлены"
log "✅ Приложение перезапущено"
log "✅ MongoDB подключение проверено"
log ""
log "⚠️ ВАЖНО:"
log "1. Очистите кеш браузера (Ctrl+Shift+Delete)"
log "2. Перезагрузите страницу (Ctrl+F5)"
log "3. Попробуйте войти снова"
log ""
log "📝 JWT_SECRET: $JWT_SECRET"
log "📁 Конфигурация: $WORK_DIR/ecosystem.config.cjs"
log "📁 .env файл: $WORK_DIR/.env"
log ""
log "🔧 Если проблемы остаются:"
log "  - Проверьте логи: pm2 logs $PROJECT_NAME --lines 20"
log "  - Проверьте статус: pm2 status"
log "  - Проверьте MongoDB: mongosh mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin"
log "  - Перезапустите приложение: pm2 restart $PROJECT_NAME"
