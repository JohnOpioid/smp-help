#!/bin/bash

# ОБНОВЛЕНИЕ ПРОЕКТА БЕЗ PWA
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

log "🚀 ОБНОВЛЕНИЕ ПРОЕКТА БЕЗ PWA..."

# Проверяем существование рабочей директории
if [ ! -d "$WORK_DIR" ]; then
    error "Рабочая директория не найдена: $WORK_DIR"
    exit 1
fi

cd "$WORK_DIR"

# 1. Генерируем новый JWT_SECRET
log "🔑 Генерируем новый JWT_SECRET..."
JWT_SECRET=$(openssl rand -hex 32)
log "✅ Новый JWT_SECRET сгенерирован"

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
MONGODB_URI=mongodb://help-smp-user:ВАШ_ПАРОЛЬ@localhost:27017/smp-help
JWT_SECRET=$JWT_SECRET
GIGACHAT_API_KEY=ВАШ_API_KEY
GIGACHAT_CLIENT_ID=ВАШ_CLIENT_ID
GIGACHAT_SCOPE=ВАШ_SCOPE
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
YAMAPS_API_KEY=0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c
EOF
log "✅ Файл .env создан"

# 4. Удаляем PWA файлы
log "🗑️ Удаляем PWA файлы..."
rm -f manifest.webmanifest
rm -f browserconfig.xml
rm -rf icons
log "✅ PWA файлы удалены"

# 5. Устанавливаем права
log "🔐 Устанавливаем права..."
chmod 644 ecosystem.config.cjs .env
chown www-data:www-data ecosystem.config.cjs .env
log "✅ Права установлены"

# 6. Перезапускаем приложение
log "🔄 Перезапускаем приложение..."
pm2 restart "$PROJECT_NAME"
pm2 save
log "✅ Приложение перезапущено"

# Ждем запуска
sleep 5

# 7. Проверяем результат
log "🔍 Проверяем результат..."

# Проверяем статус PM2
pm2 status

# Проверяем логи
log "📋 Проверяем логи..."
pm2 logs "$PROJECT_NAME" --lines 5

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

log "🎉 ПРОЕКТ ОБНОВЛЕН БЕЗ PWA!"
log ""
log "📋 Что было сделано:"
log "✅ PWA полностью отключен"
log "✅ JWT_SECRET обновлен"
log "✅ PWA файлы удалены"
log "✅ Приложение перезапущено"
log ""
log "⚠️ ВАЖНО:"
log "1. Очистите кеш браузера (Ctrl+Shift+Delete)"
log "2. Перезагрузите страницу (Ctrl+F5)"
log "3. Попробуйте войти снова"
log ""
log "📝 Новый JWT_SECRET: $JWT_SECRET"
log "📁 Конфигурация: $WORK_DIR/ecosystem.config.cjs"
log "📁 .env файл: $WORK_DIR/.env"
log ""
log "🔧 Если проблемы остаются:"
log "  - Проверьте логи: pm2 logs $PROJECT_NAME --lines 10"
log "  - Проверьте статус: pm2 status"
log "  - Перезапустите приложение: pm2 restart $PROJECT_NAME"
