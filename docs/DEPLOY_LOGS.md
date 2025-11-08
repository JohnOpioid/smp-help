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

### Проблема: "Ошибка сборки проекта"
**Решение:**
1. Проверьте логи сборки выше в консоли
2. Убедитесь, что Node.js версии 18+ установлен
3. Проверьте доступную память (нужно минимум 2GB)
4. Попробуйте собрать вручную: `cd /home/smp-help/smp-help && npm run build`

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

