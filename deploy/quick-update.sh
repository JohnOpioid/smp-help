#!/bin/bash

# Скрипт быстрого обновления SMP Help
# Запускать от пользователя smp-help

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Конфигурация
PROJECT_NAME="smp-help"
PROJECT_DIR="/home/smp-help/smp-help"
WORK_DIR="/var/www/helpsmp.ru"
GITHUB_USER="JohnOpioid"
GITHUB_PASS="Qaswer1994!"
GITHUB_REPO="https://$GITHUB_USER:$GITHUB_PASS@github.com/$GITHUB_USER/$PROJECT_NAME.git"

log "🔄 Начинаем обновление SMP Help..."

# Переходим в папку проекта
cd $PROJECT_DIR

# Получаем последние изменения
log "📥 Получаем изменения из GitHub..."
git pull origin main

# Устанавливаем зависимости
log "📦 Устанавливаем зависимости..."
npm install

# Собираем проект
log "🔨 Собираем проект..."
npm run build

# Копируем файлы (нужны права root)
log "📁 Копируем файлы..."
sudo cp -r .output/public/* $WORK_DIR/
sudo cp -r .output/server/* $WORK_DIR/
sudo chown -R smp-help:smp-help $WORK_DIR

# Перезапускаем приложение
log "🚀 Перезапускаем приложение..."
pm2 restart $PROJECT_NAME

log "✅ Обновление завершено!"
log ""
log "🔍 Проверяем статус..."
pm2 status

log ""
log "📋 Полезные команды:"
log "  - Логи: pm2 logs $PROJECT_NAME"
log "  - Статус: pm2 status"
log "  - Перезапуск: pm2 restart $PROJECT_NAME"
