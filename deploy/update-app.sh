#!/bin/bash

# Скрипт для быстрого обновления приложения
# Запускать от пользователя smp-help

set -e

echo "🔄 Обновляем SMP Help..."

cd /home/smp-help/smp-help

# Получаем последние изменения
echo "📥 Получаем обновления из репозитория..."
git pull https://JohnOpioid:Qaswer1994!@github.com/JohnOpioid/smp-help.git main

# Устанавливаем новые зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Собираем приложение
echo "🔨 Собираем приложение..."
npm run build

# Копируем файлы
echo "📁 Копируем файлы..."
sudo rm -rf /var/www/helpsmp.ru/*
sudo cp -r .output/public/* /var/www/helpsmp.ru/
sudo cp -r .output/server/* /var/www/helpsmp.ru/
sudo chown -R smp-help:smp-help /var/www/helpsmp.ru

# Перезапускаем приложение
echo "🚀 Перезапускаем приложение..."
pm2 restart smp-help

echo "✅ Обновление завершено!"
echo "Проверьте статус: pm2 status"

