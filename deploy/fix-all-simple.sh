#!/bin/bash

# Упрощенный скрипт исправления всех проблем SMP Help
# Запускать от root пользователя

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Проверяем, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Этот скрипт должен быть запущен от root пользователя${NC}"
    exit 1
fi

log "🔧 Начинаем исправление всех проблем SMP Help..."

# Конфигурация
PROJECT_NAME="smp-help"
PROJECT_USER="smp-help"
PROJECT_DIR="/home/$PROJECT_USER/$PROJECT_NAME"
WORK_DIR="/var/www/helpsmp.ru"

# Шаг 1: Исправляем конфигурацию Nuxt
log "📝 Исправляем конфигурацию Nuxt..."

cat > /tmp/nuxt.config.ts << 'EOF'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: { port: 3000, host: 'localhost' },
  modules: ['@nuxt/ui'],
  nitro: {
    preset: 'node-server'
  },
  app: {
    head: {
      title: 'Справочник СМП',
      titleTemplate: '%s — Справочник СМП',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Справочник СМП: алгоритмы, инструкции, кодификаторы и медицинские калькуляторы.' }
      ]
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smp-help',
    adminSetupToken: process.env.ADMIN_SETUP_TOKEN || 'setup-token',
    gigachatApiKey: process.env.GIGACHAT_API_KEY,
    gigachatClientId: process.env.GIGACHAT_CLIENT_ID,
    gigachatScope: process.env.GIGACHAT_SCOPE,
    public: {
      apiBase: '/api',
      yamapsApiKey: process.env.YAMAPS_API_KEY || '0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c'
    }
  },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {}
    }
  }
})
EOF

cp /tmp/nuxt.config.ts $PROJECT_DIR/nuxt.config.ts
chown $PROJECT_USER:$PROJECT_USER $PROJECT_DIR/nuxt.config.ts

log "✅ Конфигурация Nuxt обновлена"

# Шаг 2: Исправляем права доступа
log "🔐 Исправляем права доступа..."

chown -R $PROJECT_USER:$PROJECT_USER $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

log "✅ Права доступа исправлены"

# Шаг 3: Исправляем Git
log "📁 Исправляем Git конфигурацию..."

sudo -u $PROJECT_USER bash -c "
    cd $PROJECT_DIR
    git config --global --add safe.directory $PROJECT_DIR
    echo 'Git настроен'
"

log "✅ Git конфигурация исправлена"

# Шаг 4: Пересобираем проект
log "🔨 Пересобираем проект..."

sudo -u $PROJECT_USER bash -c "
    cd $PROJECT_DIR
    echo 'Очищаем кэш...'
    rm -rf .nuxt .output node_modules/.cache
    echo 'Устанавливаем зависимости...'
    npm install
    echo 'Собираем проект...'
    npm run build
    echo 'Проект собран'
"

log "✅ Проект пересобран"

# Шаг 5: Копируем файлы
log "📁 Копируем файлы в рабочую директорию..."

rm -rf $WORK_DIR/*
cp -r $PROJECT_DIR/.output/public/* $WORK_DIR/
cp -r $PROJECT_DIR/.output/server/* $WORK_DIR/
chown -R $PROJECT_USER:$PROJECT_USER $WORK_DIR
chmod -R 755 $WORK_DIR

log "✅ Файлы скопированы"

# Шаг 6: Создаем конфигурацию PM2
log "⚙️ Создаем конфигурацию PM2..."

cat > /tmp/ecosystem.config.mjs << 'EOF'
export default {
  apps: [{
    name: 'smp-help',
    script: '/var/www/helpsmp.ru/index.mjs',
    cwd: '/var/www/helpsmp.ru',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://help-smp-user:help-smp@localhost:27017/smp-help',
      JWT_SECRET: 'smp-help-2024-production-secret-key-xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567'
    },
    error_file: '/var/log/smp-help/error.log',
    out_file: '/var/log/smp-help/out.log',
    log_file: '/var/log/smp-help/combined.log',
    time: true
  }]
}
EOF

cp /tmp/ecosystem.config.mjs /home/$PROJECT_USER/ecosystem.config.mjs
chown $PROJECT_USER:$PROJECT_USER /home/$PROJECT_USER/ecosystem.config.mjs

log "✅ Конфигурация PM2 создана"

# Шаг 7: Перезапускаем сервисы
log "🚀 Перезапускаем сервисы..."

sudo -u $PROJECT_USER bash -c "
    pm2 stop smp-help 2>/dev/null || true
    pm2 delete smp-help 2>/dev/null || true
    pm2 start ecosystem.config.mjs
    pm2 save
    echo 'PM2 перезапущен'
"

systemctl restart nginx

log "✅ Сервисы перезапущены"

# Шаг 8: Проверяем работу
log "🔍 Проверяем работу системы..."

# Проверяем MongoDB
if systemctl is-active --quiet mongod; then
    log "✅ MongoDB работает"
else
    echo -e "${YELLOW}⚠️ MongoDB не работает, запускаем...${NC}"
    systemctl start mongod
fi

# Проверяем Nginx
if systemctl is-active --quiet nginx; then
    log "✅ Nginx работает"
else
    echo -e "${YELLOW}⚠️ Nginx не работает, запускаем...${NC}"
    systemctl start nginx
fi

# Проверяем PM2
if sudo -u $PROJECT_USER pm2 status | grep -q "smp-help.*online"; then
    log "✅ PM2 приложение работает"
else
    echo -e "${YELLOW}⚠️ PM2 приложение не работает${NC}"
fi

# Проверяем порт
if netstat -tlnp | grep -q ":3000"; then
    log "✅ Приложение слушает порт 3000"
else
    echo -e "${YELLOW}⚠️ Приложение не слушает порт 3000${NC}"
fi

# Проверяем статические файлы
if [ -f "$WORK_DIR/_nuxt/index.js" ]; then
    log "✅ Статические файлы на месте"
else
    echo -e "${YELLOW}⚠️ Статические файлы отсутствуют${NC}"
fi

# Шаг 9: Создаем скрипт обновления
log "📝 Создаем скрипт обновления..."

cat > /home/$PROJECT_USER/update-app.sh << 'EOF'
#!/bin/bash

set -e

echo "🔄 Обновляем SMP Help..."

cd /home/smp-help/smp-help

echo "📥 Получаем изменения из GitHub..."
git pull origin main

echo "📦 Устанавливаем зависимости..."
npm install

echo "🔨 Собираем проект..."
npm run build

echo "📁 Копируем файлы..."
sudo cp -r .output/public/* /var/www/helpsmp.ru/
sudo cp -r .output/server/* /var/www/helpsmp.ru/
sudo chown -R smp-help:smp-help /var/www/helpsmp.ru

echo "🚀 Перезапускаем приложение..."
pm2 restart smp-help

echo "✅ Обновление завершено!"
pm2 status
EOF

chown $PROJECT_USER:$PROJECT_USER /home/$PROJECT_USER/update-app.sh
chmod +x /home/$PROJECT_USER/update-app.sh

log "✅ Скрипт обновления создан"

# Очищаем временные файлы
rm -f /tmp/nuxt.config.ts /tmp/ecosystem.config.mjs

log "🎉 Все проблемы исправлены!"
log ""
log "📋 Результат:"
log "✅ Конфигурация Nuxt исправлена"
log "✅ Права доступа установлены"
log "✅ Git настроен"
log "✅ Проект пересобран"
log "✅ Файлы скопированы"
log "✅ PM2 настроен"
log "✅ Сервисы перезапущены"
log "✅ Скрипт обновления создан"
log ""
log "🔧 Полезные команды:"
log "  - Статус: su - $PROJECT_USER && pm2 status"
log "  - Логи: su - $PROJECT_USER && pm2 logs $PROJECT_NAME"
log "  - Обновление: su - $PROJECT_USER && ./update-app.sh"
log "  - Перезапуск: su - $PROJECT_USER && pm2 restart $PROJECT_NAME"
log ""
log "🌐 Проверьте сайт: https://helpsmp.ru"
