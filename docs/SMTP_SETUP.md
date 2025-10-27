# Настройка SMTP для отправки почты

## Проблема с PTR записью

Ваш сервер имеет IP `185.185.68.107`, но у этого IP отсутствует PTR запись. Это означает, что Gmail и другие почтовые сервисы будут отклонять письма с этого IP.

Ошибка в логах:
```
550-5.7.25 [185.185.68.107] The IP address sending this message does not have a 
550-5.7.25 PTR record setup
```

## Решения

### Вариант 1: Использовать Gmail SMTP (РЕКОМЕНДУЕТСЯ)

Это самый простой и надежный способ без настройки PTR.

#### Шаг 1: Создайте пароль приложения в Gmail

1. Откройте [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Войдите в свой Google аккаунт
3. Выберите устройство "Почта" и приложение "Другое"
4. Назовите приложение "SMP Help App"
5. Нажмите "Создать"
6. Скопируйте 16-символьный пароль

#### Шаг 2: Настройте переменные окружения

Добавьте в `.env` на сервере:

```bash
SMTP_SERVICE=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
```

#### Преимущества:
- ✅ Работает сразу без настройки PTR
- ✅ Высокая доставляемость
- ✅ Надежная безопасность
- ✅ Бесплатно до 500 писем/день

---

### Вариант 2: Настроить PTR запись (для провайдеров)

Если вы хотите использовать свой Postfix, нужно настроить PTR запись.

#### Что такое PTR запись?

PTR (Pointer) - обратная DNS запись, которая указывает IP-адрес на доменное имя.

#### Как настроить:

1. **Обратитесь к вашему провайдеру** (у кого арендован IP `185.185.68.107`)
2. Попросите настроить PTR запись: `185.185.68.107 -> mail.helpsmp.ru`
3. Также нужна A запись: `mail.helpsmp.ru -> 185.185.68.107`
4. И MX запись: `helpsmp.ru -> mail.helpsmp.ru`

#### После настройки PTR:

```bash
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_FROM=noreply@helpsmp.ru
```

#### Проверка PTR:

```bash
dig -x 185.185.68.107
# Должно вернуть: mail.helpsmp.ru
```

---

### Вариант 3: Использовать SMTP Relay сервисы

Можно использовать сторонние сервисы для отправки почты:

#### SendGrid (100 писем/день бесплатно)
```bash
SMTP_SERVICE=sendgrid
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@helpsmp.ru
```

#### Mailgun (5,000 писем/день бесплатно)
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@helpsmp.ru
```

---

## Текущая конфигурация для разработки

Для локальной разработки Postfix не требуется. Используйте один из вариантов выше.

## Проверка работы

1. Перезапустите приложение:
   ```bash
   pm2 restart helpsmp
   ```

2. Проверьте логи:
   ```bash
   pm2 logs helpsmp --lines 100
   ```

3. Попробуйте восстановить пароль через приложение

---

## Рекомендация

**Для production используйте Вариант 1 (Gmail)** - это самое надежное и простое решение. Настройка PTR может быть сложной и дорогой.


