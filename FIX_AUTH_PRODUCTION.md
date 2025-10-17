# ИСПРАВЛЕНИЕ АВТОРИЗАЦИИ НА ПРОДАКШЕНЕ

## Проблема:
```
POST https://helpsmp.ru/api/auth/login 500 (Server Error)
```

## РЕШЕНИЕ:

### **Вариант 1: Автоматический скрипт (рекомендуется)**
```bash
cd /tmp && wget https://raw.githubusercontent.com/JohnOpioid/smp-help/main/deploy/fix-auth-production.sh && chmod +x fix-auth-production.sh && sudo ./fix-auth-production.sh
```

### **Вариант 2: Ручное исправление**
```bash
# 1. Перейдите в рабочую директорию
cd /var/www/html/helpsmp.ru

# 2. Проверьте текущий JWT_SECRET
grep "JWT_SECRET:" ecosystem.config.cjs

# 3. Сгенерируйте новый JWT_SECRET (если нужен)
JWT_SECRET=$(openssl rand -hex 32)
echo "Новый JWT_SECRET: $JWT_SECRET"

# 4. Обновите конфигурацию PM2
sed -i "s|JWT_SECRET: '.*'|JWT_SECRET: '$JWT_SECRET'|g" ecosystem.config.cjs

# 5. Создайте файл .env
cat > .env << EOF
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://helpsmp.ru/api
NUXT_PUBLIC_APP_URL=https://helpsmp.ru
PORT=3000
MONGODB_URI=mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin
JWT_SECRET=$JWT_SECRET
ADMIN_SETUP_TOKEN=your-admin-token-here
GIGACHAT_API_KEY=
GIGACHAT_CLIENT_ID=
GIGACHAT_SCOPE=
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
YAMAPS_API_KEY=0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c
EOF

# 6. Удалите PWA файлы
rm -f manifest.webmanifest browserconfig.xml
rm -rf icons

# 7. Установите права
chmod 644 ecosystem.config.cjs .env
chown www-data:www-data ecosystem.config.cjs .env

# 8. Перезапустите приложение
pm2 stop smp-help
pm2 delete smp-help
pm2 start ecosystem.config.cjs
pm2 save
```

### **Вариант 3: Одна команда**
```bash
cd /var/www/html/helpsmp.ru && JWT_SECRET=$(openssl rand -hex 32) && sed -i "s|JWT_SECRET: '.*'|JWT_SECRET: '$JWT_SECRET'|g" ecosystem.config.cjs && cat > .env << EOF
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://helpsmp.ru/api
NUXT_PUBLIC_APP_URL=https://helpsmp.ru
PORT=3000
MONGODB_URI=mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin
JWT_SECRET=$JWT_SECRET
ADMIN_SETUP_TOKEN=your-admin-token-here
GIGACHAT_API_KEY=
GIGACHAT_CLIENT_ID=
GIGACHAT_SCOPE=
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
YAMAPS_API_KEY=0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c
EOF
&& rm -f manifest.webmanifest browserconfig.xml && rm -rf icons && chmod 644 ecosystem.config.cjs .env && chown www-data:www-data ecosystem.config.cjs .env && pm2 stop smp-help && pm2 delete smp-help && pm2 start ecosystem.config.cjs && pm2 save && echo "✅ Авторизация исправлена! JWT_SECRET: $JWT_SECRET"
```

## После исправления:

1. **Очистите кеш браузера** (Ctrl+Shift+Delete)
2. **Перезагрузите страницу** (Ctrl+F5)
3. **Попробуйте войти** снова

## Проверка:

```bash
# Проверьте JWT_SECRET
grep "JWT_SECRET:" ecosystem.config.cjs

# Проверьте логи
pm2 logs smp-help --lines 20

# Проверьте статус
pm2 status

# Проверьте доступность API
curl -I https://helpsmp.ru/api/auth/login

# Проверьте MongoDB
mongosh mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin
```

## Возможные причины ошибки 500:

1. **JWT_SECRET не настроен** - исправлено
2. **MongoDB недоступен** - проверьте подключение
3. **Неправильные права на файлы** - исправлено
4. **PWA конфликты** - исправлено
5. **Проблемы с зависимостями** - перезапуск приложения

## Диагностика:

```bash
# Проверьте логи ошибок
pm2 logs smp-help --lines 50

# Проверьте статус MongoDB
systemctl status mongod

# Проверьте доступность порта
netstat -tlnp | grep 3000

# Проверьте права на файлы
ls -la ecosystem.config.cjs .env
```

Теперь авторизация должна работать!
