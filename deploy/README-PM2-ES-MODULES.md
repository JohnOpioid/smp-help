# 🚀 Скрипты для исправления PM2 - ES модули и CommonJS

## 📋 Доступные скрипты:

### 1. `fix-pm2-es-modules.sh` - Исправление для ES модулей 🔧
**Назначение:** Исправляет PM2 для работы с ES модулями (`index.mjs`).

**Использование:**
```bash
# На сервере
su - smp-help
cd /var/www/helpsmp.ru
bash /path/to/fix-pm2-es-modules.sh
```

**Что делает:**
- ✅ Проверяет `index.mjs` и `package.json`
- ✅ Создает конфигурацию PM2 с `--experimental-modules`
- ✅ Запускает приложение
- ✅ Проверяет работу

---

### 2. `fix-pm2-commonjs.sh` - Создание CommonJS версии 📦
**Назначение:** Создает CommonJS версию (`index.js`) для PM2.

**Использование:**
```bash
# На сервере
su - smp-help
cd /var/www/helpsmp.ru
bash /path/to/fix-pm2-commonjs.sh
```

**Что делает:**
- ✅ Создает `index.js` из `index.mjs`
- ✅ Создает конфигурацию PM2 для CommonJS
- ✅ Запускает приложение
- ✅ Проверяет работу

---

### 3. `fix-pm2-universal.sh` - Универсальное исправление 🌐
**Назначение:** Пробует оба подхода - ES модули и CommonJS.

**Использование:**
```bash
# На сервере
su - smp-help
cd /var/www/helpsmp.ru
bash /path/to/fix-pm2-universal.sh
```

**Что делает:**
- ✅ Сначала пробует ES модули
- ✅ Если не работает, создает CommonJS версию
- ✅ Автоматически выбирает рабочий подход
- ✅ Проверяет все аспекты работы

---

## 🔧 Решение проблем:

### Проблема: `[PM2][ERROR] Error: No script path - aborting`
**Решение:** Используйте `fix-pm2-universal.sh`

**Причина:** PM2 не может правильно интерпретировать ES модули.

### Проблема: `⚠️ PM2 приложение не работает`
**Решение:** Используйте `fix-pm2-commonjs.sh`

**Причина:** Проблемы с ES модулями в PM2.

### Проблема: `⚠️ Статические файлы отсутствуют`
**Решение:** Используйте `fix-pm2-es-modules.sh`

**Причина:** Проблемы с копированием файлов или сборкой проекта.

---

## 📋 Что исправляют скрипты:

### 1. **Проблемы с ES модулями:**
- ✅ PM2 не может запустить `index.mjs`
- ✅ Неправильная конфигурация для ES модулей
- ✅ Отсутствие `--experimental-modules`
- ✅ Проблемы с `package.json`

### 2. **Проблемы с CommonJS:**
- ✅ Создание совместимой версии
- ✅ Правильная конфигурация PM2
- ✅ Совместимость с Node.js

### 3. **Проблемы с PM2:**
- ✅ Неправильная конфигурация
- ✅ Процесс не запускается
- ✅ Ошибки в логах
- ✅ Проблемы с правами

---

## 🚀 Быстрый старт:

### **Если PM2 не работает с ES модулями:**
```bash
# 1. Перейдите в рабочую директорию
su - smp-help
cd /var/www/helpsmp.ru

# 2. Запустите универсальное исправление
bash /path/to/fix-pm2-universal.sh

# 3. Проверьте статус
pm2 status
```

### **Если нужна только CommonJS версия:**
```bash
# 1. Перейдите в рабочую директорию
su - smp-help
cd /var/www/helpsmp.ru

# 2. Запустите создание CommonJS версии
bash /path/to/fix-pm2-commonjs.sh

# 3. Проверьте логи
pm2 logs smp-help
```

### **Если нужна только ES модули:**
```bash
# 1. Перейдите в рабочую директорию
su - smp-help
cd /var/www/helpsmp.ru

# 2. Запустите исправление ES модулей
bash /path/to/fix-pm2-es-modules.sh

# 3. Проверьте сайт
curl https://helpsmp.ru
```

---

## 📋 Полезные команды:

### PM2 управление:
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

# Запуск (ES модули)
pm2 start ecosystem.config.mjs

# Запуск (CommonJS)
pm2 start ecosystem.config.js
```

### Проверка файлов:
```bash
# Рабочая директория
ls -la /var/www/helpsmp.ru/

# ES модули
ls -la /var/www/helpsmp.ru/index.mjs

# CommonJS
ls -la /var/www/helpsmp.ru/index.js

# Статические файлы
ls -la /var/www/helpsmp.ru/_nuxt/

# Логи PM2
ls -la /var/log/pm2/
```

### Проверка портов:
```bash
# Порт 3000
netstat -tlnp | grep :3000
# или
ss -tlnp | grep :3000
# или
lsof -i :3000
```

---

## 🌐 Проверка работы:

### 1. **Проверьте сайт:**
- Откройте https://helpsmp.ru
- Проверьте, что страница загружается

### 2. **Проверьте API:**
- Откройте https://helpsmp.ru/api/health
- Должен вернуться статус 200

### 3. **Проверьте статические файлы:**
- Откройте https://helpsmp.ru/_nuxt/
- Должны загружаться JS/CSS файлы

---

## 🚨 Если ничего не помогает:

### 1. **Полная переустановка:**
```bash
# Остановите все
pm2 delete all
systemctl stop nginx
systemctl stop mongod

# Удалите проект
rm -rf /var/www/helpsmp.ru
rm -rf /home/smp-help/smp-help

# Запустите интерактивный деплой
bash /path/to/interactive-deploy.sh
# Выберите режим 3 (Переустановка)
```

### 2. **Проверьте логи:**
```bash
# PM2 логи
pm2 logs smp-help

# Nginx логи
tail -f /var/log/nginx/error.log

# MongoDB логи
tail -f /var/log/mongodb/mongod.log
```

### 3. **Проверьте права доступа:**
```bash
# Права на рабочую директорию
ls -la /var/www/helpsmp.ru/

# Права на файлы проекта
ls -la /home/smp-help/smp-help/
```

---

## 📞 Поддержка:

Если проблемы продолжаются:
1. Запустите `fix-pm2-universal.sh`
2. Сохраните вывод
3. Проверьте логи всех сервисов
4. Убедитесь, что все порты открыты
5. Проверьте, что домен правильно настроен

---

## 🔄 Обновление:

После исправления PM2, для обновления проекта используйте:
```bash
# Перейдите в папку проекта
cd /home/smp-help/smp-help

# Получите обновления
git pull origin main

# Пересоберите проект
npm install
npm run build

# Скопируйте файлы
sudo cp -r .output/public/* /var/www/helpsmp.ru/
sudo cp -r .output/server/* /var/www/helpsmp.ru/
sudo chown -R smp-help:smp-help /var/www/helpsmp.ru

# Перезапустите PM2
pm2 restart smp-help
```
