# Инструкции по исправлению PWA ошибок на продакшн сервере

## Проблема
Ошибки PWA манифеста на продакшн сервере:
- `GET https://helpsmp.ru/manifest.webmanifest 500 (Server Error)`
- `ERR_CONTENT_LENGTH_MISMATCH 500 (Server Error)`
- `bad-precaching-response`

## Решение

### 1. Очистка кэша на сервере
```bash
# Запустите скрипт очистки
node scripts/clear-pwa-cache-production.js

# Или вручную удалите файлы:
rm -f .nuxt/dist/client/sw.js
rm -f .nuxt/dist/client/workbox-*.js
rm -f .output/public/sw.js
rm -f .output/public/workbox-*.js
rm -f dist/sw.js
rm -f dist/workbox-*.js
```

### 2. Пересборка проекта
```bash
# Очистка и пересборка
rm -rf .nuxt .output dist
npm run build
```

### 3. Перезапуск сервера
```bash
# Перезапустите ваш веб-сервер (nginx/apache)
sudo systemctl reload nginx
# или
sudo systemctl reload apache2
```

### 4. Очистка кэша браузера пользователей
Добавьте в консоль браузера:
```javascript
// Очистка Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});

// Очистка кэша
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Перезагрузка страницы
location.reload();
```

## Что было исправлено

1. **Убрано дублирование манифеста** - теперь используется только статический файл `public/manifest.webmanifest`
2. **Добавлена обработка ошибок** - PWA плагин теперь корректно обрабатывает ошибки манифеста
3. **Исключен манифест из кэширования** - добавлен `**/manifest.webmanifest` в `globIgnores`
4. **Улучшена обработка ошибок** - добавлены fallback'и для критических ошибок

## Проверка

После деплоя проверьте:
1. `https://helpsmp.ru/manifest.webmanifest` - должен возвращать 200 OK
2. В DevTools > Application > Manifest - должен корректно загружаться
3. В DevTools > Application > Service Workers - не должно быть ошибок

## Мониторинг

Следите за консолью браузера на предмет ошибок:
- `bad-precaching-response` - ошибки кэширования
- `manifest fetch failed` - ошибки загрузки манифеста
- `ServiceWorker` - ошибки service worker

При появлении ошибок запустите скрипт очистки кэша.
