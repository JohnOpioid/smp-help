# Полный скрипт деплоя SMP Help

## 🚀 Быстрый старт

### 1. Подключитесь к серверу
```bash
ssh root@185.185.68.107
```

### 2. Загрузите и запустите полный скрипт деплоя
```bash
# Загружаем скрипт
wget https://raw.githubusercontent.com/JohnOpioid/smp-help/main/deploy/full-deploy.sh

# Делаем исполняемым
chmod +x full-deploy.sh

# Запускаем полный деплой
./full-deploy.sh
```

## 📋 Что делает скрипт

### ✅ Автоматически устанавливает:
- Node.js 18
- MongoDB 7.0
- Nginx
- PM2
- Certbot

### ✅ Настраивает:
- Пользователя `smp-help`
- Базу данных MongoDB с аутентификацией
- Конфигурацию PM2
- Конфигурацию Nginx
- Firewall

### ✅ Деплоит:
- Клонирует проект из GitHub
- Устанавливает зависимости
- Собирает проект
- Копирует файлы в рабочую директорию
- Запускает приложение

## 🔧 После деплоя

### Настройка SSL
```bash
certbot --nginx -d helpsmp.ru -d www.helpsmp.ru
```

### Проверка работы
```bash
# Проверяем статус
su - smp-help
pm2 status

# Проверяем логи
pm2 logs smp-help

# Проверяем сайт
curl -I https://helpsmp.ru
```

## 🔄 Обновление проекта

### Быстрое обновление
```bash
# Переключаемся на пользователя smp-help
su - smp-help

# Запускаем скрипт обновления
./update-app.sh
```

### Ручное обновление
```bash
# Переходим в папку проекта
cd /home/smp-help/smp-help

# Получаем изменения
git pull origin main

# Устанавливаем зависимости
npm install

# Собираем проект
npm run build

# Копируем файлы
sudo cp -r .output/public/* /var/www/helpsmp.ru/
sudo cp -r .output/server/* /var/www/helpsmp.ru/
sudo chown -R smp-help:smp-help /var/www/helpsmp.ru

# Перезапускаем приложение
pm2 restart smp-help
```

## 🛠️ Управление приложением

### Команды PM2
```bash
# Статус
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

### Команды системы
```bash
# Статус сервисов
systemctl status mongod
systemctl status nginx

# Перезапуск сервисов
systemctl restart mongod
systemctl restart nginx
```

## 🔍 Диагностика проблем

### Проверка логов
```bash
# Логи приложения
pm2 logs smp-help --lines 50

# Логи Nginx
tail -f /var/log/nginx/helpsmp.ru.error.log

# Логи MongoDB
tail -f /var/log/mongodb/mongod.log
```

### Проверка портов
```bash
# Проверяем порты
netstat -tlnp | grep :3000
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

### Проверка подключений
```bash
# Тестируем приложение
curl -I http://localhost:3000

# Тестируем MongoDB
mongosh --eval "db.runCommand('ping')"
```

## 📁 Структура файлов

```
/home/smp-help/
├── smp-help/                    # Исходный код проекта
│   ├── .output/                 # Собранные файлы
│   ├── pages/
│   ├── components/
│   └── ...
├── update-app.sh               # Скрипт обновления
├── start-app.sh                # Скрипт запуска
└── ecosystem.config.mjs        # Конфигурация PM2

/var/www/helpsmp.ru/            # Рабочая директория
├── index.mjs                   # Главный файл приложения
├── _nuxt/                      # Статические файлы
└── ...

/var/log/smp-help/              # Логи приложения
├── error.log
├── out.log
└── combined.log
```

## ⚠️ Важные моменты

1. **Скрипт должен запускаться от root**
2. **Все данные уже встроены в скрипт**
3. **После деплоя настройте SSL сертификат**
4. **Регулярно обновляйте проект через update-app.sh**

## 🆘 Поддержка

Если что-то не работает:

1. Проверьте логи: `pm2 logs smp-help`
2. Проверьте статус: `pm2 status`
3. Перезапустите: `pm2 restart smp-help`
4. Проверьте права: `ls -la /var/www/helpsmp.ru/`

## 📞 Контакты

- Сервер: 185.185.68.107
- Домен: helpsmp.ru
- Пользователь: smp-help
- GitHub: JohnOpioid/smp-help
