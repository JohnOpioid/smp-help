#!/bin/bash

# Скрипт для деплоя приложения SMP Help
# Запускать от пользователя smp-help

set -e

echo "🚀 Начинаем деплой SMP Help..."

# Переходим в домашнюю директорию
cd /home/smp-help

# Клонируем репозиторий
echo "📥 Клонируем репозиторий..."
if [ -d "smp-help" ]; then
    echo "📁 Репозиторий уже существует, обновляем..."
    cd smp-help
    git pull origin main
else
    echo "📥 Клонируем новый репозиторий..."
    git clone https://JohnOpioid:Qaswer1994!@github.com/JohnOpioid/smp-help.git
    cd smp-help
fi

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Создаем файл окружения для продакшена
echo "⚙️ Создаем конфигурацию окружения..."
cat > .env.production << EOF
# Production Environment Variables
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://helpsmp.ru/api
NUXT_PUBLIC_APP_URL=https://helpsmp.ru

# MongoDB
MONGODB_URI=mongodb://localhost:27017/smp-help

# JWT Secret (ЗАМЕНИТЕ НА СВОЙ СЕКРЕТНЫЙ КЛЮЧ)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI Configuration (если используете)
GIGACHAT_API_KEY=your-gigachat-api-key
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1

# Email Configuration (если используете)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF

# Собираем приложение
echo "🔨 Собираем приложение..."
npm run build

# Копируем файлы в рабочую директорию
echo "📁 Копируем файлы в рабочую директорию..."
sudo rm -rf /var/www/helpsmp.ru/*
sudo cp -r .output/public/* /var/www/helpsmp.ru/
sudo cp -r .output/server/* /var/www/helpsmp.ru/
sudo chown -R smp-help:smp-help /var/www/helpsmp.ru

# Создаем конфигурацию PM2
echo "⚙️ Создаем конфигурацию PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'smp-help',
    script: '/var/www/helpsmp.ru/index.mjs',
    cwd: '/var/www/helpsmp.ru',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://localhost:27017/smp-help',
      JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production'
    },
    error_file: '/var/log/smp-help/error.log',
    out_file: '/var/log/smp-help/out.log',
    log_file: '/var/log/smp-help/combined.log',
    time: true
  }]
}
EOF

# Останавливаем старые процессы
echo "🛑 Останавливаем старые процессы..."
pm2 stop smp-help || true
pm2 delete smp-help || true

# Запускаем приложение
echo "🚀 Запускаем приложение..."
pm2 start ecosystem.config.js

# Сохраняем конфигурацию PM2
pm2 save
pm2 startup

echo "✅ Деплой завершен!"
echo ""
echo "Проверьте статус: pm2 status"
echo "Логи: pm2 logs smp-help"
echo "Перезапуск: pm2 restart smp-help"

