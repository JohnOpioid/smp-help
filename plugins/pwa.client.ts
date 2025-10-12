export default defineNuxtPlugin(() => {
  if (process.client && 'serviceWorker' in navigator) {
    // Регистрируем service worker
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker зарегистрирован:', registration)
        
        // Проверяем наличие обновлений
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Новый service worker установлен и готов к активации
                // Отправляем событие о доступности обновления
                window.dispatchEvent(new CustomEvent('pwa-update-available'))
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('Ошибка регистрации Service Worker:', error)
      })
    
    // Обрабатываем сообщения от service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        // Service worker получил команду на активацию
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      }
    })
  }
})