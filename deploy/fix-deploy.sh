#!/bin/bash

# Быстрое исправление деплоя для SMP Help
# Исправляет ошибку с отсутствующей директорией .output/server

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Переменные
PROJECT_DIR="/home/smp-help/smp-help"
WORK_DIR="/var/www/html/helpsmp.ru"

log "🔧 Исправляем деплой..."

# Переходим в директорию проекта
cd "$PROJECT_DIR"

# Проверяем, что директория существует
if [ ! -d "$PROJECT_DIR" ]; then
    error "Директория проекта не найдена: $PROJECT_DIR"
    exit 1
fi

# Проверяем наличие .output
if [ ! -d ".output" ]; then
    error "Директория .output не найдена. Сначала соберите проект."
    exit 1
fi

log "📁 Копируем файлы в рабочую директорию..."

# Сохраняем конфигурацию PM2 если есть
if [ -f "$WORK_DIR/ecosystem.config.cjs" ]; then
    cp "$WORK_DIR/ecosystem.config.cjs" "/tmp/ecosystem.config.cjs.backup"
    log "✅ Конфигурация PM2 сохранена"
fi

# Очищаем рабочую директорию
rm -rf "$WORK_DIR"/*

# Копируем файлы в зависимости от типа сборки
if [ -d ".output/server" ]; then
    cp -r .output/server/* "$WORK_DIR/"
    log "✅ Серверные файлы скопированы"
else
    warn "Директория .output/server не найдена - статическая сборка"
fi

if [ -d ".output/public" ]; then
    cp -r .output/public/* "$WORK_DIR/" 2>/dev/null || true
    log "✅ Статические файлы скопированы"
else
    error "Директория .output/public не найдена"
    exit 1
fi

# Восстанавливаем конфигурацию PM2
if [ -f "/tmp/ecosystem.config.cjs.backup" ]; then
    cp "/tmp/ecosystem.config.cjs.backup" "$WORK_DIR/ecosystem.config.cjs"
    log "✅ Конфигурация PM2 восстановлена"
fi

# Устанавливаем права доступа
chmod -R 755 "$WORK_DIR"

log "🚀 Перезапускаем приложение..."
pm2 restart smp-help

log "✅ Деплой исправлен и приложение перезапущено!"
log "🌐 Сайт доступен по адресу: https://helpsmp.ru"
