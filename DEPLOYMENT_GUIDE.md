# Руководство по деплою Справочника СМП на Ubuntu сервер

## 📋 Обзор проекта

**Справочник СМП** - это веб-приложение на Nuxt.js 3 с серверной частью на Node.js, использующее MongoDB в качестве базы данных. Проект включает:

- **Frontend**: Nuxt.js 3, Vue 3, TypeScript, Tailwind CSS
- **Backend**: Nuxt Server API, MongoDB
- **Аутентификация**: JWT токены
- **AI интеграция**: GigaChat API, NuxtHub AI
- **Карты**: Yandex Maps API

## 🚀 Подготовка сервера Ubuntu

### 1. Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка Node.js (версия 18+)
```bash
# Установка Node.js через NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии
node --version
npm --version
```

### 3. Установка MongoDB
```bash
# Импорт публичного ключа MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Добавление репозитория MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Установка MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Запуск и включение автозапуска MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Проверка статуса
sudo systemctl status mongod
```

### 4. Установка PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 5. Установка Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Установка Git
```bash
sudo apt install git -y
```

## 📁 Подготовка проекта

### 1. Клонирование репозитория
```bash
# Переход в домашнюю директорию
cd ~

# Клонирование проекта (замените на ваш репозиторий)
git clone https://github.com/your-username/smp-help.git
cd smp-help
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения
```bash
# Копирование файла примера
cp env.example .env

# Редактирование файла .env
nano .env
```

**Содержимое файла `.env` для продакшена:**
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/smp-help

# JWT Secret (ОБЯЗАТЕЛЬНО измените на сложный ключ!)
JWT_SECRET=your-super-secure-jwt-secret-key-for-production-2024

# Yandex Maps API Key
YAMAPS_API_KEY=your-yandex-maps-api-key

# GigaChat AI (опционально)
GIGACHAT_API_KEY=your-gigachat-api-key
GIGACHAT_CLIENT_ID=your-gigachat-client-id
GIGACHAT_SCOPE=GIGACHAT_API_PERS

# NuxtHub (опционально)
NUXT_HUB_PROJECT_SECRET_KEY=your-hub-secret-key
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id

# Настройки продакшена
NODE_ENV=production
PORT=3000
```

## 🔧 Сборка и запуск

### 1. Сборка проекта
```bash
# Сборка для продакшена
npm run build
```

### 2. Создание PM2 конфигурации
```bash
# Создание файла конфигурации PM2
nano ecosystem.config.js
```

**Содержимое `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'smp-help',
    script: '.output/server/index.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
```

### 3. Создание директории для логов
```bash
mkdir logs
```

### 4. Запуск приложения через PM2
```bash
# Запуск приложения
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска PM2
pm2 startup
```

## 🌐 Настройка Nginx

### 1. Создание конфигурации сайта
```bash
sudo nano /etc/nginx/sites-available/smp-help
```

**Содержимое конфигурации Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Замените на ваш домен

    # Логи
    access_log /var/log/nginx/smp-help.access.log;
    error_log /var/log/nginx/smp-help.error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 10M;

    # Основное приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Статические файлы
    location /_nuxt/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Активация сайта
```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/smp-help /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl reload nginx
```

## 🔒 Настройка SSL (Let's Encrypt)

### 1. Установка Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Получение SSL сертификата
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 3. Настройка автообновления
```bash
sudo crontab -e
```

Добавьте строку:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Настройка MongoDB

### 1. Создание пользователя базы данных
```bash
# Подключение к MongoDB
mongosh

# Создание пользователя администратора
use admin
db.createUser({
  user: "admin",
  pwd: "help-smp",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Создание пользователя для приложения
use smp-help
db.createUser({
  user: "help-smp-user",
  pwd: "help-smp",
  roles: ["readWrite"]
})

exit
```

### 2. Настройка аутентификации MongoDB
```bash
sudo nano /etc/mongod.conf
```

Добавьте/измените:
```yaml
security:
  authorization: enabled
```

### 3. Перезапуск MongoDB
```bash
sudo systemctl restart mongod
```

### 4. Обновление строки подключения в .env
```env
MONGODB_URI=mongodb://smp-help-user:your-app-password@localhost:27017/smp-help
```

## 📊 Мониторинг и логи

### 1. Просмотр логов PM2
```bash
# Логи приложения
pm2 logs smp-help

# Мониторинг процессов
pm2 monit
```

### 2. Просмотр логов Nginx
```bash
# Логи доступа
sudo tail -f /var/log/nginx/smp-help.access.log

# Логи ошибок
sudo tail -f /var/log/nginx/smp-help.error.log
```

### 3. Просмотр логов MongoDB
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

## 🔄 Обновление приложения

### 1. Скрипт обновления
```bash
nano update.sh
```

**Содержимое `update.sh`:**
```bash
#!/bin/bash

echo "🔄 Обновление Справочника СМП..."

# Переход в директорию проекта
cd ~/smp-help

# Получение последних изменений
git pull origin main

# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Перезапуск приложения
pm2 restart smp-help

echo "✅ Обновление завершено!"
```

### 2. Делаем скрипт исполняемым
```bash
chmod +x update.sh
```

### 3. Запуск обновления
```bash
./update.sh
```

## 🛡️ Безопасность

### 1. Настройка файрвола
```bash
# Установка UFW
sudo ufw enable

# Разрешение SSH
sudo ufw allow ssh

# Разрешение HTTP и HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Проверка статуса
sudo ufw status
```

### 2. Настройка fail2ban
```bash
# Установка fail2ban
sudo apt install fail2ban -y

# Создание конфигурации
sudo nano /etc/fail2ban/jail.local
```

**Содержимое `jail.local`:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/smp-help.error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/smp-help.access.log
maxretry = 10
```

### 3. Перезапуск fail2ban
```bash
sudo systemctl restart fail2ban
```

## 📈 Оптимизация производительности

### 1. Настройка MongoDB
```bash
sudo nano /etc/mongod.conf
```

Добавьте оптимизации:
```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1  # Половина от RAM

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

operationProfiling:
  slowOpThresholdMs: 100
  mode: slowOp
```

### 2. Настройка Nginx для кэширования
```bash
sudo nano /etc/nginx/sites-available/smp-help
```

Добавьте в блок `server`:
```nginx
# Кэширование статических файлов
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    proxy_pass http://localhost:3000;
}

# Сжатие
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

## 🚨 Резервное копирование

### 1. Скрипт резервного копирования
```bash
nano backup.sh
```

**Содержимое `backup.sh`:**
```bash
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="smp-help"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Бэкап MongoDB
mongodump --db $DB_NAME --out $BACKUP_DIR/mongodb_$DATE

# Бэкап файлов приложения
tar -czf $BACKUP_DIR/app_$DATE.tar.gz ~/smp-help

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "mongodb_*" -type d -mtime +7 -exec rm -rf {} \;
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete

echo "✅ Резервное копирование завершено: $DATE"
```

### 2. Настройка cron для автоматических бэкапов
```bash
crontab -e
```

Добавьте:
```bash
# Ежедневный бэкап в 2:00
0 2 * * * /home/ubuntu/smp-help/backup.sh
```

## 📋 Чек-лист деплоя

- [ ] ✅ Обновлена система Ubuntu
- [ ] ✅ Установлен Node.js 18+
- [ ] ✅ Установлен MongoDB
- [ ] ✅ Установлен PM2
- [ ] ✅ Установлен Nginx
- [ ] ✅ Клонирован репозиторий
- [ ] ✅ Установлены зависимости
- [ ] ✅ Настроен файл .env
- [ ] ✅ Собран проект
- [ ] ✅ Настроен PM2
- [ ] ✅ Настроен Nginx
- [ ] ✅ Настроен SSL
- [ ] ✅ Настроена безопасность MongoDB
- [ ] ✅ Настроен файрвол
- [ ] ✅ Настроен fail2ban
- [ ] ✅ Настроено резервное копирование
- [ ] ✅ Протестировано приложение

## 🆘 Устранение неполадок

### Проблема: Приложение не запускается
```bash
# Проверка логов PM2
pm2 logs smp-help

# Проверка статуса процессов
pm2 status

# Перезапуск приложения
pm2 restart smp-help
```

### Проблема: MongoDB не подключается
```bash
# Проверка статуса MongoDB
sudo systemctl status mongod

# Проверка логов MongoDB
sudo tail -f /var/log/mongodb/mongod.log

# Перезапуск MongoDB
sudo systemctl restart mongod
```

### Проблема: Nginx не работает
```bash
# Проверка конфигурации
sudo nginx -t

# Проверка статуса
sudo systemctl status nginx

# Перезапуск Nginx
sudo systemctl reload nginx
```

## 📞 Поддержка

При возникновении проблем проверьте:
1. Логи приложения: `pm2 logs smp-help`
2. Логи Nginx: `sudo tail -f /var/log/nginx/smp-help.error.log`
3. Логи MongoDB: `sudo tail -f /var/log/mongodb/mongod.log`
4. Статус сервисов: `sudo systemctl status mongod nginx`

---

**Удачного деплоя! 🚀**
