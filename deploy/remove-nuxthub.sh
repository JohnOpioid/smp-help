#!/bin/bash

# Скрипт для удаления NuxtHub и пересборки проекта
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

# Переменные
PROJECT_USER="helpsmp"
GITHUB_REPO="smp-help"
PROJECT_DIR="/home/$PROJECT_USER/$GITHUB_REPO"

log "🔧 Удаляем NuxtHub и пересобираем проект..."

# Проверяем, что директория проекта существует
if [ ! -d "$PROJECT_DIR" ]; then
    error "❌ Директория проекта не найдена: $PROJECT_DIR"
    exit 1
fi

# Останавливаем PM2 процессы
log "🛑 Останавливаем PM2 процессы..."
sudo -u $PROJECT_USER pm2 stop all 2>/dev/null || true
sudo -u $PROJECT_USER pm2 delete all 2>/dev/null || true

# Переключаемся на пользователя проекта
sudo -u $PROJECT_USER bash -c "
    cd $PROJECT_DIR
    
    echo '📥 Получаем обновления из GitHub...'
    git pull origin main
    
    echo '🗑️ Удаляем node_modules и package-lock.json...'
    rm -rf node_modules package-lock.json
    
    echo '📦 Устанавливаем зависимости...'
    npm install
    
    echo '🔨 Собираем проект...'
    npm run build
    
    echo '✅ Проект пересобран без NuxtHub'
"

# Проверяем, что сборка прошла успешно
if [ -d "$PROJECT_DIR/.output" ]; then
    log "✅ Проект успешно пересобран"
    log "📁 Директория .output создана"
else
    error "❌ Проект не собран, директория .output не найдена"
    exit 1
fi

log "🎉 Удаление NuxtHub и пересборка завершены!"
log "📋 Теперь можно продолжить установку:"
log "  bash continue-install-fixed.sh"
