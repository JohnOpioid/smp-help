# Как проверить логи при деплое

## 1. Логи сборки (во время деплоя)

Логи сборки выводятся прямо в консоль во время выполнения скрипта деплоя. Если сборка завершилась с ошибкой, проверьте:

```bash
# Повторный запуск сборки с подробными логами
cd /home/smp-help/smp-help
npm run build 2>&1 | tee build.log
```

## 2. Логи PM2 (после деплоя)

### Просмотр логов в реальном времени
```bash
pm2 logs smp-help
```

### Последние строки логов
```bash
# Последние 100 строк
pm2 logs smp-help --lines 100

# Только ошибки (последние 50 строк)
pm2 logs smp-help --err --lines 50

# Только вывод (последние 50 строк)
pm2 logs smp-help --out --lines 50
```

### Статус приложения
```bash
# Статус всех процессов
pm2 status

# Детальная информация о приложении
pm2 describe smp-help

# Мониторинг в реальном времени
pm2 monit
```

## 3. Файлы логов PM2

Логи PM2 сохраняются в `/var/log/smp-help/`:

```bash
# Основной лог (объединенный)
tail -f /var/log/smp-help/smp-help.log

# Лог ошибок
tail -f /var/log/smp-help/smp-help-error.log

# Лог вывода
tail -f /var/log/smp-help/smp-help-out.log

# Последние 100 строк ошибок
tail -n 100 /var/log/smp-help/smp-help-error.log
```

## 4. Логи Nginx

```bash
# Лог ошибок Nginx
tail -f /var/log/nginx/error.log

# Лог доступа
tail -f /var/log/nginx/access.log

# Лог для конкретного домена (если настроен)
tail -f /var/log/nginx/your-domain.com.error.log
```

## 5. Системные логи (journalctl)

```bash
# Логи MongoDB
sudo journalctl -u mongod -n 50 -f

# Логи Nginx
sudo journalctl -u nginx -n 50 -f

# Логи системы (общие)
sudo journalctl -xe

# Логи за последний час
sudo journalctl --since "1 hour ago"
```

## 6. Проверка структуры сборки

Если сборка завершилась, но приложение не работает, проверьте структуру:

```bash
# Проверка директории сборки
ls -la /home/smp-help/smp-help/.output/

# Проверка рабочей директории
ls -la /home/smp-help/smp-help-work/

# Проверка наличия index.mjs
ls -la /home/smp-help/smp-help-work/index.mjs
```

## 7. Диагностика проблем

### Если сборка завершилась, но приложение не запускается:

```bash
# 1. Проверьте статус PM2
pm2 status

# 2. Проверьте логи PM2
pm2 logs smp-help --lines 50

# 3. Проверьте, что файлы скопированы
ls -la /home/smp-help/smp-help-work/

# 4. Попробуйте запустить вручную
cd /home/smp-help/smp-help-work
node index.mjs
```

### Если ошибка на этапе сборки Nitro:

```bash
# Проверьте версию Node.js
node --version

# Проверьте память
free -h

# Попробуйте собрать вручную
cd /home/smp-help/smp-help
npm run build
```

## 8. Полезные команды для отладки

```bash
# Очистка логов PM2
pm2 flush smp-help

# Перезапуск с очисткой логов
pm2 restart smp-help --update-env

# Экспорт логов в файл
pm2 logs smp-help --lines 1000 > /tmp/pm2-logs.txt

# Проверка портов
netstat -tlnp | grep :3000
# или
ss -tlnp | grep :3000
```

## 9. Типичные проблемы и решения

### Проблема: "Ошибка сборки проекта" или "Сборка прерывается"
**Решение:**
1. **Проверьте логи сборки:**
   ```bash
   tail -100 /tmp/build.log
   # или для обновления
   tail -100 /tmp/build-update.log
   ```

2. **Проверьте версию Node.js (нужна 18+):**
   ```bash
   node --version
   ```

3. **Проверьте доступную память (нужно минимум 2GB, рекомендуется 4GB):**
   ```bash
   free -h
   ```

4. **Очистите кеш и попробуйте собрать вручную:**
   ```bash
   cd /home/smp-help/smp-help
   rm -rf .nuxt .output node_modules/.cache
   npm run build:production
   ```

5. **Если сборка прерывается по таймауту:**
   - Увеличьте таймаут в скрипте деплоя (по умолчанию 30 минут)
   - Проверьте, не блокируется ли процесс другими задачами
   - Убедитесь, что на сервере достаточно ресурсов

6. **Если проблема с памятью:**
   - Увеличьте лимит памяти в `package.json`: `NODE_OPTIONS=--max-old-space-size=6144` (6GB)
   - Закройте другие процессы, потребляющие память
   - Рассмотрите возможность увеличения swap-файла

7. **Если сборка зависает на этапе Nitro:**
   - Проверьте, не блокируются ли внешние запросы
   - Убедитесь, что MongoDB доступен (если используется при сборке)
   - Попробуйте отключить source maps в `nuxt.config.ts`

### Проблема: Приложение не запускается в PM2
**Решение:**
1. Проверьте логи: `pm2 logs smp-help --err`
2. Проверьте конфигурацию: `cat /home/smp-help/smp-help-work/ecosystem.config.cjs`
3. Проверьте переменные окружения
4. Попробуйте запустить вручную: `cd /home/smp-help/smp-help-work && node index.mjs`

### Проблема: 502 Bad Gateway
**Решение:**
1. Проверьте, что PM2 запущен: `pm2 status`
2. Проверьте логи Nginx: `tail -f /var/log/nginx/error.log`
3. Проверьте, что приложение слушает порт 3000: `netstat -tlnp | grep :3000`

