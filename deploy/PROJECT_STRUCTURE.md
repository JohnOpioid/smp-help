# Структура проекта SMP Help

## Директории проекта

### 1. Репозиторий (клонирование и сборка)
```
/home/smp-help/smp-help/
```
- **Назначение:** Клонирование репозитория GitHub
- **Содержимое:** Исходный код, node_modules, .output после сборки
- **Операции:** `git pull`, `npm install`, `npm run build`

### 2. Рабочая директория (production)
```
/var/www/html/helpsmp.ru/
```
- **Назначение:** Собранное приложение для production
- **Содержимое:** Скомпилированные файлы из `.output/`
- **Операции:** PM2 запускает приложение отсюда
- **Nginx:** Проксирует запросы и раздаёт статику

### 3. Логи
```
/var/log/smp-help/
```
- **Назначение:** Логи приложения
- **Файлы:**
  - `smp-help.log` - объединённые логи
  - `smp-help-out.log` - stdout
  - `smp-help-error.log` - stderr

## Процесс развёртывания

### Шаг 1: Клонирование
```bash
cd /home/smp-help/
git clone https://github.com/USER/REPO.git smp-help
```

### Шаг 2: Установка зависимостей
```bash
cd /home/smp-help/smp-help/
npm install
```

### Шаг 3: Сборка
```bash
npm run build
# Создаётся директория .output/
```

### Шаг 4: Копирование в production
```bash
rm -rf /var/www/html/helpsmp.ru/*
cp -r .output/public/* /var/www/html/helpsmp.ru/
cp -r .output/server/* /var/www/html/helpsmp.ru/
```

### Шаг 5: Запуск через PM2
```bash
cd /var/www/html/helpsmp.ru/
pm2 start ecosystem.config.cjs
```

## Конфигурация Nginx

```nginx
server {
    listen 80;
    server_name helpsmp.ru www.helpsmp.ru;
    
    # Корневая директория
    root /var/www/html/helpsmp.ru;
    
    # Проксирование на Node.js
    location / {
        proxy_pass http://localhost:3000;
        # ... другие заголовки
    }
    
    # Статические файлы Nuxt
    location /_nuxt/ {
        alias /var/www/html/helpsmp.ru/_nuxt/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## PM2 Конфигурация

```javascript
module.exports = {
  apps: [{
    name: 'smp-help',
    script: './index.mjs',
    cwd: '/var/www/html/helpsmp.ru',  // Рабочая директория
    // ... остальная конфигурация
  }]
}
```

## Обновление приложения

### Автоматически (рекомендуется):
```bash
/root/update-app.sh
```

### Вручную:
```bash
# 1. Обновить репозиторий
cd /home/smp-help/smp-help/
git pull origin main

# 2. Установить зависимости
npm install

# 3. Собрать проект
npm run build

# 4. Копировать в production
rm -rf /var/www/html/helpsmp.ru/*
cp -r .output/public/* /var/www/html/helpsmp.ru/
cp -r .output/server/* /var/www/html/helpsmp.ru/

# 5. Перезапустить PM2
pm2 restart smp-help
```

## Права доступа

```bash
# Директория репозитория
chown -R root:root /home/smp-help/smp-help/

# Рабочая директория
chown -R root:root /var/www/html/helpsmp.ru/
chmod -R 755 /var/www/html/helpsmp.ru/

# Логи
chown -R root:root /var/log/smp-help/
chmod -R 755 /var/log/smp-help/
```

## Проверка статуса

```bash
# PM2
pm2 status
pm2 logs smp-help

# Nginx
systemctl status nginx
nginx -t

# MongoDB
systemctl status mongod

# Проверить файлы
ls -la /var/www/html/helpsmp.ru/
ls -la /home/smp-help/smp-help/.output/
```

## Диагностика проблем

### Приложение не запускается

```bash
# Проверить, что файлы скопированы
ls -la /var/www/html/helpsmp.ru/
# Должен быть index.mjs и другие файлы

# Проверить логи PM2
pm2 logs smp-help --lines 50

# Проверить конфигурацию
cat /var/www/html/helpsmp.ru/ecosystem.config.cjs
```

### 404 ошибки для статики

```bash
# Проверить директорию _nuxt
ls -la /var/www/html/helpsmp.ru/_nuxt/

# Проверить конфигурацию Nginx
cat /etc/nginx/sites-available/helpsmp.ru
nginx -t

# Проверить логи Nginx
tail -f /var/log/nginx/helpsmp.ru.error.log
```

### Ошибки MongoDB

```bash
# Проверить подключение
mongosh "mongodb://help-smp-user:PASSWORD@localhost:27017/smp-help"

# Проверить переменные окружения PM2
pm2 env smp-help | grep MONGODB
```

## Резервное копирование

### База данных MongoDB

```bash
# Создать backup
mongodump --db smp-help --out /root/backups/mongodb/$(date +%Y%m%d)

# Восстановить backup
mongorestore --db smp-help /root/backups/mongodb/YYYYMMDD/smp-help/
```

### Файлы приложения

```bash
# Backup production
tar -czf /root/backups/app-$(date +%Y%m%d).tar.gz /var/www/html/helpsmp.ru/

# Backup репозитория
tar -czf /root/backups/repo-$(date +%Y%m%d).tar.gz /home/smp-help/smp-help/
```

## Откат версии

```bash
# 1. Откатить Git
cd /home/smp-help/smp-help/
git log --oneline  # Найти нужный коммит
git checkout COMMIT_HASH

# 2. Пересобрать
npm install
npm run build

# 3. Скопировать в production
rm -rf /var/www/html/helpsmp.ru/*
cp -r .output/public/* /var/www/html/helpsmp.ru/
cp -r .output/server/* /var/www/html/helpsmp.ru/

# 4. Перезапустить
pm2 restart smp-help
```

## Полезные команды

```bash
# Полный статус системы
/root/check-status.sh

# Обновление приложения
/root/update-app.sh

# Запуск приложения
/root/start-app.sh

# Перезапуск PM2
pm2 restart smp-help

# Перезапуск Nginx
systemctl restart nginx

# Просмотр логов в реальном времени
pm2 logs smp-help
tail -f /var/log/nginx/helpsmp.ru.error.log
```

## SSL сертификат

```bash
# Получить сертификат
certbot --nginx -d helpsmp.ru -d www.helpsmp.ru

# Проверить срок действия
certbot certificates

# Обновить сертификат
certbot renew
```

## Переменные окружения

Основные переменные в `ecosystem.config.cjs`:

- `NODE_ENV` - режим работы (production)
- `PORT` - порт приложения (3000)
- `MONGODB_URI` - подключение к MongoDB
- `JWT_SECRET` - секрет для JWT токенов
- `NUXT_PUBLIC_APP_URL` - URL приложения
- `NUXT_PUBLIC_API_BASE_URL` - URL API

## Мониторинг

```bash
# Использование ресурсов PM2
pm2 monit

# Статус всех процессов
pm2 status

# Информация о процессе
pm2 describe smp-help

# Использование диска
df -h

# Использование памяти
free -h
```

