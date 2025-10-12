// Скрипт для очистки кеша PWA
// Выполните в консоли браузера для очистки всех кешей

console.log('🧹 Очистка кеша PWA...')

// Очищаем все кеши
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('Найдены кеши:', cacheNames)
    
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log('Удаляем кеш:', cacheName)
        return caches.delete(cacheName)
      })
    )
  }).then(() => {
    console.log('✅ Все кеши очищены')
    
    // Перезагружаем страницу
    window.location.reload()
  }).catch(error => {
    console.error('❌ Ошибка при очистке кеша:', error)
  })
} else {
  console.log('❌ Кеши не поддерживаются в этом браузере')
}

// Очищаем localStorage
localStorage.clear()
console.log('✅ localStorage очищен')

// Очищаем sessionStorage
sessionStorage.clear()
console.log('✅ sessionStorage очищен')
