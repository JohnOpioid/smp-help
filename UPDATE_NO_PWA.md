# ОБНОВЛЕНИЕ ПРОЕКТА БЕЗ PWA

## Проблемы:
1. ❌ **JWT_SECRET ошибка** - "Ошибка конфигурации сервера"
2. ❌ **PWA файлы** - manifest.webmanifest и иконки больше не нужны
3. ❌ **404 ошибки** - иконки не найдены

## РЕШЕНИЕ:

### **Вариант 1: Автоматический скрипт (рекомендуется)**
```bash
cd /tmp && wget https://raw.githubusercontent.com/JohnOpioid/smp-help/main/deploy/update-no-pwa.sh && chmod +x update-no-pwa.sh && sudo ./update-no-pwa.sh
```

### **Вариант 2: Ручное обновление**
```bash
# 1. Перейдите в рабочую директорию
cd /var/www/html/helpsmp.ru

# 2. Сгенерируйте новый JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32)
echo "Новый JWT_SECRET: $JWT_SECRET"

# 3. Обновите конфигурацию PM2
sed -i "s|JWT_SECRET: '.*'|JWT_SECRET: '$JWT_SECRET'|g" ecosystem.config.cjs

# 4. Создайте файл .env
cat > .env << EOF
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://helpsmp.ru/api
NUXT_PUBLIC_APP_URL=https://helpsmp.ru
PORT=3000
MONGODB_URI=mongodb://help-smp-user:ВАШ_ПАРОЛЬ@localhost:27017/smp-help
JWT_SECRET=$JWT_SECRET
GIGACHAT_API_KEY=ВАШ_API_KEY
GIGACHAT_CLIENT_ID=ВАШ_CLIENT_ID
GIGACHAT_SCOPE=ВАШ_SCOPE
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
YAMAPS_API_KEY=0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c
EOF

# 5. Удалите PWA файлы
rm -f manifest.webmanifest
rm -f browserconfig.xml
rm -rf icons

# 6. Установите права
chmod 644 ecosystem.config.cjs .env
chown www-data:www-data ecosystem.config.cjs .env

# 7. Перезапустите приложение
pm2 restart smp-help
pm2 save
```

### **Вариант 3: Одна команда**
```bash
cd /var/www/html/helpsmp.ru && JWT_SECRET=$(openssl rand -hex 32) && sed -i "s|JWT_SECRET: '.*'|JWT_SECRET: '$JWT_SECRET'|g" ecosystem.config.cjs && cat > .env << EOF
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://helpsmp.ru/api
NUXT_PUBLIC_APP_URL=https://helpsmp.ru
PORT=3000
MONGODB_URI=mongodb://help-smp-user:ВАШ_ПАРОЛЬ@localhost:27017/smp-help
JWT_SECRET=$JWT_SECRET
GIGACHAT_API_KEY=ВАШ_API_KEY
GIGACHAT_CLIENT_ID=ВАШ_CLIENT_ID
GIGACHAT_SCOPE=ВАШ_SCOPE
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
YAMAPS_API_KEY=0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c
EOF
&& rm -f manifest.webmanifest browserconfig.xml && rm -rf icons && chmod 644 ecosystem.config.cjs .env && chown www-data:www-data ecosystem.config.cjs .env && pm2 restart smp-help && pm2 save && echo "✅ Проект обновлен без PWA! JWT_SECRET: $JWT_SECRET"
```

## После обновления:

1. **Очистите кеш браузера** (Ctrl+Shift+Delete)
2. **Перезагрузите страницу** (Ctrl+F5)
3. **Попробуйте войти** снова

## Проверка:

```bash
# Проверьте JWT_SECRET
grep "JWT_SECRET:" ecosystem.config.cjs

# Проверьте логи
pm2 logs smp-help --lines 5

# Проверьте статус
pm2 status

# Проверьте доступность API
curl -I https://helpsmp.ru/api/auth/login
```

## Что изменилось:

✅ **PWA полностью отключен:**
- Удален модуль `@vite-pwa/nuxt`
- Удалена конфигурация PWA
- Удалены PWA файлы (manifest.webmanifest, browserconfig.xml, icons)
- Удалены PWA мета-теги

✅ **JWT_SECRET исправлен:**
- Сгенерирован новый безопасный ключ
- Обновлен в конфигурации PM2
- Создан файл .env

✅ **Ошибки 404 исправлены:**
- Удалены ссылки на несуществующие иконки
- Создан базовый favicon.ico

Теперь проект работает без PWA и с исправленным JWT_SECRET!
