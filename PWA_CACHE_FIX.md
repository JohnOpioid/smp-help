# Инструкция по очистке кеша PWA

## Проблема
Workbox пытается найти предзакешированную страницу `/offline`, но не может её найти, что блокирует загрузку сайта.

## Решение

### 1. Очистка кеша браузера
1. Откройте DevTools (F12)
2. Перейдите на вкладку "Application" (Chrome) или "Storage" (Firefox)
3. В разделе "Storage" найдите "Cache Storage"
4. Удалите все кеши, особенно те, что содержат "workbox" или "precache"
5. Также очистите "Local Storage" и "Session Storage"

### 2. Программная очистка
Выполните в консоли браузера:

```javascript
// Очистка всех кешей
caches.keys().then(cacheNames => {
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )
}).then(() => {
  console.log('Кеши очищены')
  window.location.reload()
})

// Очистка localStorage
localStorage.clear()
sessionStorage.clear()
```

### 3. Жесткая перезагрузка
- **Windows/Linux**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R

### 4. Отключение PWA в разработке
В `nuxt.config.ts` установлено:
```typescript
devOptions: {
  enabled: false, // PWA отключен в режиме разработки
  suppressWarnings: true
}
```

### 5. Перезапуск сервера разработки
```bash
npm run dev
```

## Что исправлено

1. **Убрана специальная обработка `/offline`** - теперь все страницы обрабатываются одинаково через `NetworkFirst`
2. **Отключен PWA в разработке** - избегаем проблем с кешированием при разработке
3. **Упрощена конфигурация Workbox** - убраны конфликтующие правила кеширования

## Результат
После очистки кеша сайт должен загружаться нормально без ошибок Workbox.
