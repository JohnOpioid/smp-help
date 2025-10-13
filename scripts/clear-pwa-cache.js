// Скрипт для очистки PWA кэша и Service Worker
// Запускать в консоли браузера на продакшн сайте

console.log('🧹 Начинаем очистку PWA кэша...')

// 1. Удаляем все регистрации Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log(`📱 Найдено ${registrations.length} Service Worker регистраций`)
    registrations.forEach(registration => {
      console.log('🗑️ Удаляем Service Worker:', registration.scope)
      registration.unregister()
    })
  })
}

// 2. Очищаем все кэши
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log(`💾 Найдено ${cacheNames.length} кэшей`)
    cacheNames.forEach(cacheName => {
      console.log('🗑️ Удаляем кэш:', cacheName)
      caches.delete(cacheName)
    })
  })
}

// 3. Очищаем localStorage и sessionStorage
console.log('🗑️ Очищаем localStorage и sessionStorage')
localStorage.clear()
sessionStorage.clear()

console.log('✅ Очистка завершена! Перезагрузите страницу.')