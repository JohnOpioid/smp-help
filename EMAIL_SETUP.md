# Настройка отправки Email на Ubuntu

## Установка зависимостей

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

## Настройка переменных окружения

Добавьте следующие переменные в файл `.env`:

```bash
# Email Configuration
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=your-email@yandex.ru
SMTP_PASS=your-app-password
```

### Получение пароля приложения для Yandex

1. Войдите в аккаунт Yandex
2. Перейдите в настройки → Безопасность
3. Активируйте двухфакторную аутентификацию (если не активирована)
4. Создайте пароль приложения:
   - Перейдите в "Пароли приложений"
   - Создайте новый пароль для "Почта"
   - Скопируйте полученный пароль в `SMTP_PASS`

### Альтернативные SMTP сервера

#### Gmail

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Для Gmail нужно создать пароль приложения:
1. Перейдите в настройки аккаунта Google
2. Включите двухфакторную аутентификацию
3. Создайте пароль приложения в разделе "Безопасность"

#### Mail.ru

```bash
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=your-email@mail.ru
SMTP_PASS=your-password
```

#### SendGrid (рекомендуется для production)

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## Настройка на сервере Ubuntu

### 1. Установка Node.js и зависимостей

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установите npm зависимости
cd /var/www/html/helpsmp.ru
npm install
```

### 2. Настройка переменных окружения

```bash
# Откройте файл .env
nano /var/www/html/helpsmp.ru/.env

# Добавьте настройки SMTP
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=your-email@yandex.ru
SMTP_PASS=your-app-password
```

### 3. Перезапуск приложения

```bash
# Перезапустите приложение через PM2
pm2 restart smp-help

# Проверьте логи
pm2 logs smp-help
```

## Тестирование отправки email

### Через API

```bash
curl -X POST https://helpsmp.ru/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Проверка логов

```bash
# Проверьте логи PM2
pm2 logs smp-help

# Или проверьте системные логи
journalctl -u pm2-smp-help -f
```

## Устранение неполадок

### Email не отправляется

1. Проверьте настройки SMTP:
   ```bash
   pm2 env smp-help | grep SMTP
   ```

2. Проверьте логи:
   ```bash
   pm2 logs smp-help --lines 100
   ```

3. Проверьте, что порт не заблокирован:
   ```bash
   sudo ufw allow 587/tcp
   sudo ufw allow 465/tcp
   ```

### Ошибка "ECONNREFUSED"

- Проверьте правильность `SMTP_HOST`
- Убедитесь, что порт не заблокирован firewall
- Для порта 587 убедитесь, что используется TLS

### Ошибка авторизации

- Проверьте правильность `SMTP_USER` и `SMTP_PASS`
- Для Yandex/Gmail используйте пароль приложения, а не основной пароль аккаунта
- Убедитесь, что двухфакторная аутентификация включена

## Безопасность

### Рекомендации:

1. **Никогда не коммитьте** файл `.env` в репозиторий
2. Используйте **пароли приложений**, а не основной пароль аккаунта
3. Регулярно **ротируйте пароли**
4. Используйте **SendGrid** или другие специализированные сервисы для production

### Добавление в .gitignore

Убедитесь, что `.env` добавлен в `.gitignore`:

```bash
echo ".env" >> .gitignore
```

## Альтернатива: локальный SMTP сервер

Для локальной разработки можно использовать локальный SMTP сервер:

```bash
# Установите mailcatcher
gem install mailcatcher

# Запустите mailcatcher
mailcatcher

# Используйте настройки:
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
```

Email будет доступен по адресу http://localhost:1080

## Production рекомендации

Для production рекомендуется использовать специализированные сервисы:

1. **SendGrid** - бесплатный план до 100 писем/день
2. **Amazon SES** - дешевый, надежный
3. **Mailgun** - бесплатный план до 5000 писем/месяц
4. **Postmark** - хорошая доставляемость

Пример настройки SendGrid:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
```


