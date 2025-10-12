# Установка MongoDB через скрипт

Скрипт `interactive-deploy.sh` теперь поддерживает автоматическую установку MongoDB 8.0.

## Выбор при установке

При запуске скрипта вам будет задан вопрос:

```
=== НАСТРОЙКА MONGODB ===

Установить MongoDB 8.0 на сервере? (y/N)
  - Выберите 'y' если MongoDB не установлен
  - Выберите 'N' если MongoDB уже установлен
>
```

### Вариант 1: Установить MongoDB (y)

**Выбирайте это если:**
- MongoDB не установлен на сервере
- Это первая установка проекта
- Хотите, чтобы скрипт всё настроил автоматически

**Что происходит:**
1. ✅ Установка зависимостей (wget, curl, gnupg)
2. ✅ Добавление GPG ключа MongoDB
3. ✅ Добавление репозитория MongoDB 8.0
4. ✅ Установка MongoDB
5. ✅ Запуск и включение автозапуска
6. ✅ Создание пользователя с указанными учётными данными
7. ✅ Включение аутентификации в конфигурации
8. ✅ Перезапуск MongoDB с аутентификацией

**Конфигурация после установки:**
- Аутентификация включена (`authorization: enabled`)
- Пользователь создан с правами `readWrite` и `dbAdmin` на вашу базу
- Служба настроена на автозапуск

### Вариант 2: MongoDB уже установлен (N)

**Выбирайте это если:**
- MongoDB уже установлен на сервере
- Вы самостоятельно устанавливали MongoDB ранее
- Хотите использовать существующую установку

**Что происходит:**
1. ✅ Проверка наличия MongoDB
2. ✅ Проверка статуса службы
3. ✅ Запуск MongoDB если остановлен
4. ✅ Проверка подключения с указанными учётными данными
5. ⚠️  Предупреждение если учётные данные неверны

**Примечание:** Если пользователь не существует, скрипт выведет инструкцию по созданию пользователя вручную.

## Учётные данные MongoDB

После выбора установки вам нужно указать:

```
Введите название базы данных (по умолчанию: smp-help)
> smp-help

Введите имя пользователя MongoDB (по умолчанию: help-smp-user)
> help-smp-user

Введите пароль MongoDB пользователя
> [ваш_пароль или оставьте пустым для автогенерации]
```

- **База данных:** Название базы для проекта (по умолчанию: smp-help)
- **Пользователь:** Имя пользователя MongoDB (по умолчанию: help-smp-user)
- **Пароль:** 
  - Введите свой пароль
  - ИЛИ оставьте пустым - будет сгенерирован автоматически (16 символов)

## Что устанавливается

### Версия MongoDB
- MongoDB 8.0 (последняя стабильная версия для Ubuntu)

### Репозиторий
```bash
deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu VERSION/mongodb-org/8.0 multiverse
```
Где VERSION определяется автоматически на основе вашей версии Ubuntu.

### Создаваемый пользователь

```javascript
{
  user: "help-smp-user",  // или ваше имя
  pwd: "пароль",
  roles: [
    { role: "readWrite", db: "smp-help" },  // чтение и запись
    { role: "dbAdmin", db: "smp-help" }     // администрирование БД
  ]
}
```

### Конфигурация MongoDB

Скрипт добавляет в `/etc/mongod.conf`:

```yaml
security:
  authorization: enabled
```

## Проверка установки

После установки скрипт автоматически проверяет:

1. Запущена ли служба MongoDB
2. Можно ли подключиться с указанными учётными данными
3. Доступна ли база данных

## Ручная установка MongoDB (если нужно)

Если вы предпочитаете установить MongoDB вручную:

```bash
# 1. Установка зависимостей
sudo apt update
sudo apt install -y wget curl gnupg software-properties-common

# 2. Импорт GPG ключа
wget -qO - https://www.mongodb.org/static/pgp/server-8.0.asc | sudo apt-key add -

# 3. Добавление репозитория
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# 4. Установка MongoDB
sudo apt update
sudo apt install -y mongodb-org

# 5. Запуск
sudo systemctl start mongod
sudo systemctl enable mongod

# 6. Создание пользователя
mongosh
use admin
db.createUser({
  user: "help-smp-user",
  pwd: "your_password",
  roles: [
    { role: "readWrite", db: "smp-help" },
    { role: "dbAdmin", db: "smp-help" }
  ]
})
exit

# 7. Включение аутентификации
sudo nano /etc/mongod.conf
# Добавьте:
# security:
#   authorization: enabled

# 8. Перезапуск
sudo systemctl restart mongod
```

После этого при запуске скрипта выберите "N" (MongoDB уже установлен).

## Решение проблем

### MongoDB не устанавливается

**Проблема:** Ошибка при добавлении репозитория

**Решение:**
```bash
# Проверьте версию Ubuntu
lsb_release -cs

# Для старых версий Ubuntu может потребоваться другой репозиторий
# Например, для Ubuntu 20.04 (focal):
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org/8.0.list
```

### Не удаётся создать пользователя

**Проблема:** Ошибка при создании пользователя

**Решение:**
```bash
# Проверьте, что MongoDB запущен без аутентификации
sudo systemctl stop mongod
sudo nano /etc/mongod.conf
# Закомментируйте строки:
# #security:
# #  authorization: enabled

# Перезапустите
sudo systemctl start mongod

# Создайте пользователя
mongosh
use admin
db.createUser({
  user: "help-smp-user",
  pwd: "your_password",
  roles: [{role: "readWrite", db: "smp-help"}]
})
exit

# Включите аутентификацию обратно
sudo nano /etc/mongod.conf
# Раскомментируйте:
# security:
#   authorization: enabled

# Перезапустите
sudo systemctl restart mongod
```

### Проблемы с подключением

**Проблема:** Приложение не может подключиться к MongoDB

**Решение:**
```bash
# 1. Проверьте статус MongoDB
sudo systemctl status mongod

# 2. Проверьте логи
sudo journalctl -u mongod -n 50

# 3. Проверьте подключение вручную
mongosh "mongodb://help-smp-user:PASSWORD@localhost:27017/smp-help"

# 4. Проверьте конфигурацию
cat /etc/mongod.conf

# 5. Проверьте, что порт 27017 слушается
sudo netstat -tlnp | grep 27017
```

## Настройка для удалённого доступа

Если нужен доступ к MongoDB извне:

```bash
# 1. Измените конфигурацию
sudo nano /etc/mongod.conf

# 2. Измените bindIp
net:
  port: 27017
  bindIp: 0.0.0.0  # Разрешить все IP

# 3. Настройте firewall
sudo ufw allow from YOUR_IP to any port 27017

# 4. Перезапустите MongoDB
sudo systemctl restart mongod
```

**Важно:** Открытие MongoDB для внешних подключений требует дополнительных мер безопасности!

## Рекомендации по безопасности

1. **Используйте сложные пароли** (минимум 16 символов)
2. **Не используйте стандартные имена пользователей** в production
3. **Настройте firewall** для ограничения доступа
4. **Регулярно делайте backup** базы данных
5. **Обновляйте MongoDB** до последних версий
6. **Используйте SSL/TLS** для удалённых подключений
7. **Мониторьте логи** на предмет подозрительной активности

## Резервное копирование

```bash
# Создание backup
mongodump --uri="mongodb://help-smp-user:PASSWORD@localhost:27017/smp-help" --out=/root/backups/mongo-$(date +%Y%m%d)

# Восстановление backup
mongorestore --uri="mongodb://help-smp-user:PASSWORD@localhost:27017/smp-help" /root/backups/mongo-YYYYMMDD/smp-help/

# Автоматический backup (добавьте в crontab)
0 2 * * * mongodump --uri="mongodb://help-smp-user:PASSWORD@localhost:27017/smp-help" --out=/root/backups/mongo-$(date +\%Y\%m\%d)
```

## Мониторинг MongoDB

```bash
# Статус службы
systemctl status mongod

# Логи в реальном времени
sudo journalctl -u mongod -f

# Подключение к MongoDB
mongosh "mongodb://help-smp-user:PASSWORD@localhost:27017/smp-help"

# Проверка версии
mongod --version

# Статистика базы
mongosh "mongodb://help-smp-user:PASSWORD@localhost:27017/smp-help" --eval "db.stats()"

# Список коллекций
mongosh "mongodb://help-smp-user:PASSWORD@localhost:27017/smp-help" --eval "db.getCollectionNames()"
```

## Полезные ссылки

- [Официальная документация MongoDB](https://docs.mongodb.com/)
- [Руководство по установке для Ubuntu](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)
- [Руководство по безопасности](https://docs.mongodb.com/manual/security/)
- [Резервное копирование и восстановление](https://docs.mongodb.com/manual/core/backups/)

