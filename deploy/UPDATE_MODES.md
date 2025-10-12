# Режимы обновления проекта

## Режим 2: Быстрое обновление (Quick Update)

**Для чего:** Обновление кода из GitHub без переустановки зависимостей

**Что делает:**
1. ✅ Читает существующую конфигурацию из `ecosystem.config.cjs`
2. ✅ Запрашивает только GitHub токен
3. ✅ Обновляет код из GitHub (`git pull`)
4. ✅ Пересобирает проект (`npm run build`)
5. ✅ Сохраняет `ecosystem.config.cjs` перед копированием
6. ✅ Копирует новые файлы в рабочую директорию
7. ✅ Восстанавливает `ecosystem.config.cjs`
8. ✅ Перезапускает PM2

**Время выполнения:** ~2-3 минуты

**Когда использовать:**
- Внесли изменения в код
- Обновили компоненты или страницы
- Исправили баги
- Не меняли зависимости в `package.json`

**Использование:**

```bash
./interactive-deploy.sh
# Выберите: 2) Обновление проекта
# Введите только GitHub токен
# Дождитесь завершения
```

**Автоматическое чтение конфигурации:**
- Название проекта
- Домен
- Рабочая директория
- MongoDB учётные данные
- JWT Secret
- API ключи (GigaChat, Yandex Maps)
- SMTP настройки

**Что НЕ делает:**
- ❌ Не переустанавливает Node.js
- ❌ Не переустанавливает зависимости npm
- ❌ Не перенастраивает Nginx
- ❌ Не перенастраивает Firewall
- ❌ Не удаляет данные MongoDB

---

## Режим 3: Полное обновление (Full Update)

**Для чего:** Обновление с переустановкой зависимостей и проверкой конфигурации

**Что делает:**
1. ✅ Читает существующую конфигурацию
2. ✅ Запрашивает только GitHub токен
3. ✅ Создаёт необходимые директории
4. ✅ Обновляет код из GitHub
5. ✅ Переустанавливает зависимости (`npm install`)
6. ✅ Пересобирает проект
7. ✅ Копирует файлы
8. ✅ Перенастраивает PM2
9. ✅ Обновляет скрипты управления
10. ✅ Проверяет DNS и статус

**Время выполнения:** ~5-7 минут

**Когда использовать:**
- Обновили зависимости в `package.json`
- Изменили версию Node.js
- Нужна полная проверка конфигурации
- Долго не обновляли проект

**Использование:**

```bash
./interactive-deploy.sh
# Выберите: 3) Полное обновление
# Введите только GitHub токен
# Дождитесь завершения
```

---

## Сравнение режимов обновления

| Действие | Quick Update (2) | Full Update (3) |
|----------|------------------|-----------------|
| Чтение конфигурации | ✅ | ✅ |
| Ввод параметров | Только токен | Только токен |
| Git pull | ✅ | ✅ |
| npm install | ❌ | ✅ |
| npm build | ✅ | ✅ |
| Копирование файлов | ✅ | ✅ |
| Настройка PM2 | Restart | Пересоздание |
| Настройка Nginx | ❌ | ❌ |
| Обновление скриптов | ❌ | ✅ |
| Проверка DNS | ❌ | ✅ |
| Время | ~2-3 мин | ~5-7 мин |

---

## Пример использования

### Быстрое обновление после изменения кода

```bash
# 1. Внесите изменения в код на локальном компьютере
# 2. Закоммитьте и отправьте на GitHub
git add .
git commit -m "Исправление бага"
git push origin main

# 3. На сервере запустите обновление
ssh root@185.185.68.107
./interactive-deploy.sh

# Выберите: 2) Обновление проекта
# Введите GitHub токен: [ваш_токен]
# Готово!
```

### Полное обновление после обновления зависимостей

```bash
# 1. Обновили package.json
npm install
git add package.json package-lock.json
git commit -m "Обновление зависимостей"
git push origin main

# 2. На сервере
ssh root@185.185.68.107
./interactive-deploy.sh

# Выберите: 3) Полное обновление
# Введите GitHub токен
# Готово!
```

---

## Что читается из конфигурации

Из файла `/var/www/html/helpsmp.ru/ecosystem.config.cjs` автоматически читается:

### Основные параметры
- `name` → PROJECT_NAME
- `cwd` → WORK_DIR
- Домен извлекается из WORK_DIR

### MongoDB
- `MONGODB_URI` → парсится на:
  - MONGO_USER
  - MONGO_PASS
  - MONGO_DB

### Безопасность
- `JWT_SECRET` → сохраняется

### API ключи
- `GIGACHAT_API_KEY`
- `GIGACHAT_CLIENT_ID`
- `GIGACHAT_SCOPE`
- `YAMAPS_API_KEY`

### SMTP
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

---

## Если конфигурация не найдена

Если файл `ecosystem.config.cjs` отсутствует:

```
⚠️  Конфигурация не найдена, требуется ввод параметров
```

Скрипт попросит ввести все параметры вручную, как при чистой установке.

---

## Ручное обновление (альтернатива)

Если предпочитаете делать вручную:

```bash
# Используйте готовый скрипт
/root/update-app.sh

# Или вручную
cd /home/smp-help/smp-help
cp /var/www/html/helpsmp.ru/ecosystem.config.cjs /tmp/backup.cjs
git pull origin main
npm run build
rm -rf /var/www/html/helpsmp.ru/*
cp -r .output/* /var/www/html/helpsmp.ru/
cp /tmp/backup.cjs /var/www/html/helpsmp.ru/ecosystem.config.cjs
pm2 restart smp-help
```

---

## Советы по использованию

### Для ежедневных обновлений
Используйте **Quick Update (2)** - быстро и эффективно

### Для важных обновлений
Используйте **Full Update (3)** - с полной проверкой

### Для экстренных исправлений
```bash
# Самый быстрый способ
/root/update-app.sh
```

### Перед важными обновлениями
```bash
# Сделайте backup MongoDB
mongodump --uri="mongodb://help-smp-user:PASSWORD@localhost:27017/smp-help?authSource=admin" \
  --out=/root/backups/mongo-$(date +%Y%m%d_%H%M%S)

# Сделайте backup приложения
tar -czf /root/backups/app-$(date +%Y%m%d_%H%M%S).tar.gz /var/www/html/helpsmp.ru/
```

---

## Проверка после обновления

```bash
# Статус PM2
pm2 status

# Логи (первые 20 строк)
pm2 logs smp-help --lines 20

# Проверка сайта
curl -I http://helpsmp.ru

# Проверка алгоритмов
curl -I http://helpsmp.ru/algorithms

# Проверка подстанций
curl -I http://helpsmp.ru/substations
```

---

## Откат после неудачного обновления

Если что-то пошло не так:

```bash
# Откатите Git
cd /home/smp-help/smp-help
git log --oneline | head -10
git checkout PREVIOUS_COMMIT_HASH

# Пересоберите
npm run build

# Скопируйте
cp /var/www/html/helpsmp.ru/ecosystem.config.cjs /tmp/backup.cjs
rm -rf /var/www/html/helpsmp.ru/*
cp -r .output/* /var/www/html/helpsmp.ru/
cp /tmp/backup.cjs /var/www/html/helpsmp.ru/ecosystem.config.cjs

# Перезапустите
pm2 restart smp-help
```

