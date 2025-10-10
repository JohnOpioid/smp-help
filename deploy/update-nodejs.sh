#!/bin/bash

# Скрипт для обновления Node.js до версии 20
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

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log "🔧 Обновляем Node.js до версии 20..."

# Проверяем текущую версию
CURRENT_NODE=$(node --version 2>/dev/null || echo "не установлен")
log "Текущая версия Node.js: $CURRENT_NODE"

# Проверяем, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    error "Этот скрипт должен быть запущен от root пользователя"
    exit 1
fi

# Останавливаем PM2 процессы если они запущены
log "🛑 Останавливаем PM2 процессы..."
if command -v pm2 >/dev/null 2>&1; then
    sudo -u helpsmp pm2 stop all 2>/dev/null || true
    sudo -u helpsmp pm2 delete all 2>/dev/null || true
fi

# Удаляем старую версию Node.js
log "🗑️ Удаляем старую версию Node.js..."
apt remove nodejs -y 2>/dev/null || true

# Обновляем репозитории
log "📦 Обновляем репозитории..."
apt update

# Устанавливаем Node.js 20
log "📦 Устанавливаем Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверяем установку
NEW_NODE=$(node --version)
NEW_NPM=$(npm --version)

log "✅ Node.js обновлен до версии: $NEW_NODE"
log "✅ npm обновлен до версии: $NEW_NPM"

# Переустанавливаем PM2
log "📦 Переустанавливаем PM2..."
npm install -g pm2

# Проверяем PM2
PM2_VERSION=$(pm2 --version)
log "✅ PM2 версия: $PM2_VERSION"

log "🎉 Обновление Node.js завершено!"
log ""
log "📋 Теперь можно продолжить установку:"
log "  cd /home/helpsmp/smp-help"
log "  npm install"
log "  npm run build"
log ""
log "🔧 Или запустить полный скрипт установки:"
log "  bash continue-install-fixed.sh"
