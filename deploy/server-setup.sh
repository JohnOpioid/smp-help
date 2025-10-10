#!/bin/bash

# Скрипт для первоначальной настройки Ubuntu сервера
# Запускать с правами root: sudo bash server-setup.sh

set -e

echo "🚀 Начинаем настройку сервера для SMP Help..."

# Обновляем систему
echo "📦 Обновляем систему..."
apt update && apt upgrade -y

# Устанавливаем необходимые пакеты
echo "📦 Устанавливаем базовые пакеты..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Устанавливаем Node.js 18
echo "📦 Устанавливаем Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Устанавливаем MongoDB
echo "📦 Устанавливаем MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Запускаем и включаем автозапуск MongoDB
systemctl start mongod
systemctl enable mongod

# Устанавливаем Nginx
echo "📦 Устанавливаем Nginx..."
apt install -y nginx

# Устанавливаем PM2 для управления процессами
echo "📦 Устанавливаем PM2..."
npm install -g pm2

# Устанавливаем Certbot для SSL
echo "📦 Устанавливаем Certbot..."
apt install -y certbot python3-certbot-nginx

# Создаем пользователя для приложения
echo "👤 Создаем пользователя smp-help..."
useradd -m -s /bin/bash smp-help
usermod -aG sudo smp-help

# Создаем директории
echo "📁 Создаем директории..."
mkdir -p /var/www/helpsmp.ru
mkdir -p /var/log/smp-help
chown -R smp-help:smp-help /var/www/helpsmp.ru
chown -R smp-help:smp-help /var/log/smp-help

# Настраиваем firewall
echo "🔥 Настраиваем firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo "✅ Настройка сервера завершена!"
echo ""
echo "Следующие шаги:"
echo "1. Переключитесь на пользователя smp-help: su - smp-help"
echo "2. Запустите скрипт деплоя: bash deploy-app.sh"
echo "3. Настройте SSL: sudo certbot --nginx -d helpsmp.ru"

