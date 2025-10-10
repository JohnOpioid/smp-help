# Инструкция по деплою SMP Help на Ubuntu сервер

## Подготовка сервера

### 1. Подключение к серверу
```bash
ssh root@185.185.68.107
```

### 2. Первоначальная настройка сервера
```bash
# Загружаем и запускаем скрипт настройки
wget https://raw.githubusercontent.com/JohnOpioid/smp-help/main/deploy/server-setup.sh
chmod +x server-setup.sh
sudo bash server-setup.sh
```

### 3. Переключение на пользователя приложения
```bash
su - smp-help
```

## Деплой приложения

### 1. Настройка репозитория
```bash
# Создаем SSH ключ для GitHub (если нужно)
ssh-keygen -t rsa -b 4096 -C "smp-help@helpsmp.ru"
cat ~/.ssh/id_rsa.pub
# Добавьте этот ключ в GitHub Settings > SSH Keys
```

### 2. Клонирование и деплой
```bash
# Загружаем скрипт деплоя
wget https://raw.githubusercontent.com/JohnOpioid/smp-help/main/deploy/deploy-app.sh
chmod +x deploy-app.sh

# Запускаем деплой (скрипт уже содержит правильные данные GitHub)
bash deploy-app.sh
```

### 3. Настройка Nginx
```bash
# Возвращаемся к root
exit

# Копируем конфигурацию Nginx
wget https://raw.githubusercontent.com/JohnOpioid/smp-help/main/deploy/nginx-helpsmp.conf
cp nginx-helpsmp.conf /etc/nginx/sites-available/helpsmp.ru
ln -s /etc/nginx/sites-available/helpsmp.ru /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию
rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
nginx -t

# Перезапускаем Nginx
systemctl restart nginx
```

### 4. Настройка SSL (Let's Encrypt)
```bash
# Получаем SSL сертификат
certbot --nginx -d helpsmp.ru -d www.helpsmp.ru

# Проверяем автообновление
certbot renew --dry-run
```

## Настройка переменных окружения

### 1. Создание .env.production
```bash
su - smp-help
cd /home/smp-help/smp-help
nano .env.production
```

### 2. Содержимое .env.production
```bash
# Основные настройки
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://helpsmp.ru/api
NUXT_PUBLIC_APP_URL=https://helpsmp.ru
PORT=3000

# База данных MongoDB
MONGODB_URI=mongodb://localhost:27017/smp-help

# JWT Secret (ОБЯЗАТЕЛЬНО ЗАМЕНИТЕ!)
JWT_SECRET=ваш-супер-секретный-ключ-для-jwt-токенов

# AI Configuration (если используете)
GIGACHAT_API_KEY=ваш-ключ-gigachat
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1

# Email Configuration (если используете)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ваш-email@gmail.com
SMTP_PASS=ваш-пароль-приложения
```

## Управление приложением

### Команды PM2
```bash
# Статус приложения
pm2 status

# Логи
pm2 logs smp-help

# Перезапуск
pm2 restart smp-help

# Остановка
pm2 stop smp-help

# Удаление
pm2 delete smp-help
```

### Обновление приложения
```bash
su - smp-help
cd /home/smp-help/smp-help
git pull https://JohnOpioid:Qaswer1994!@github.com/JohnOpioid/smp-help.git main
npm install
npm run build
pm2 restart smp-help
```

## Проверка работы

### 1. Проверка сервисов
```bash
# MongoDB
systemctl status mongod

# Nginx
systemctl status nginx

# PM2
pm2 status
```

### 2. Проверка портов
```bash
netstat -tlnp | grep :3000
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

### 3. Проверка логов
```bash
# Логи приложения
pm2 logs smp-help

# Логи Nginx
tail -f /var/log/nginx/helpsmp.ru.access.log
tail -f /var/log/nginx/helpsmp.ru.error.log

# Логи MongoDB
tail -f /var/log/mongodb/mongod.log
```

## Безопасность

### 1. Настройка firewall
```bash
ufw status
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

### 2. Обновление системы
```bash
apt update && apt upgrade -y
```

### 3. Резервное копирование
```bash
# Создаем скрипт бэкапа
cat > /home/smp-help/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db smp-help --out /home/smp-help/backups/mongodb_$DATE
tar -czf /home/smp-help/backups/app_$DATE.tar.gz /var/www/helpsmp.ru
find /home/smp-help/backups -name "*.tar.gz" -mtime +7 -delete
find /home/smp-help/backups -name "mongodb_*" -mtime +7 -exec rm -rf {} \;
EOF

chmod +x /home/smp-help/backup.sh
mkdir -p /home/smp-help/backups

# Добавляем в cron (ежедневно в 2:00)
crontab -e
# Добавьте строку: 0 2 * * * /home/smp-help/backup.sh
```

## Мониторинг

### 1. Установка мониторинга
```bash
npm install -g pm2-logrotate
pm2 install pm2-logrotate
```

### 2. Настройка алертов
```bash
# Создаем скрипт проверки
cat > /home/smp-help/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "Application is down!" | mail -s "SMP Help Alert" admin@helpsmp.ru
    pm2 restart smp-help
fi
EOF

chmod +x /home/smp-help/health-check.sh

# Добавляем в cron (каждые 5 минут)
crontab -e
# Добавьте строку: */5 * * * * /home/smp-help/health-check.sh
```

## Troubleshooting

### Проблемы с MongoDB
```bash
# Проверка статуса
systemctl status mongod

# Перезапуск
systemctl restart mongod

# Проверка логов
journalctl -u mongod -f
```

### Проблемы с Nginx
```bash
# Проверка конфигурации
nginx -t

# Перезапуск
systemctl restart nginx

# Проверка логов
tail -f /var/log/nginx/error.log
```

### Проблемы с приложением
```bash
# Проверка статуса PM2
pm2 status

# Перезапуск
pm2 restart smp-help

# Полные логи
pm2 logs smp-help --lines 100
```

## Контакты для поддержки

- Сервер: 185.185.68.107
- Домен: helpsmp.ru
- Пользователь: smp-help
- Логи: /var/log/smp-help/

