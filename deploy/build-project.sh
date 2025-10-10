#!/bin/bash

# Простой скрипт для сборки проекта SMP Help
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

log "🔨 Собираем проект SMP Help..."

# Проверяем, что директория проекта существует
if [ ! -d "$PROJECT_DIR" ]; then
    error "❌ Директория проекта не найдена: $PROJECT_DIR"
    exit 1
fi

# Переключаемся на пользователя проекта
sudo -u $PROJECT_USER bash -c "
    cd $PROJECT_DIR
    
    echo '📦 Устанавливаем зависимости...'
    npm install
    
    echo '🔨 Собираем проект...'
    npm run build
    
    echo '✅ Проект собран'
"

# Проверяем, что сборка прошла успешно
if [ -d "$PROJECT_DIR/.output" ]; then
    log "✅ Проект успешно собран"
    log "📁 Директория .output создана"
    ls -la "$PROJECT_DIR/.output/"
else
    error "❌ Проект не собран, директория .output не найдена"
    exit 1
fi

log "🎉 Сборка завершена!"
log "📋 Теперь можно запустить: bash continue-install-fixed.sh"
