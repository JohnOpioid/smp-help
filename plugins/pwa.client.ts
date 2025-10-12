export default defineNuxtPlugin(() => {
  if (process.client && 'serviceWorker' in navigator) {
    // Ждем готовности DOM и Nuxt PWA
    nextTick(() => {
      // Проверяем наличие зарегистрированного service worker
      const checkServiceWorker = () => {
        navigator.serviceWorker.getRegistration()
          .then((registration) => {
            if (registration) {
              console.log('Service Worker найден:', registration)
              
              // Проверяем наличие обновлений
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      // Новый service worker установлен и готов к активации
                      console.log('Доступно обновление PWA')
                      window.dispatchEvent(new CustomEvent('pwa-update-available'))
                    }
                  })
                }
              })
            } else {
              // Если service worker еще не зарегистрирован, проверяем через некоторое время
              setTimeout(checkServiceWorker, 1000)
            }
          })
          .catch((error) => {
            console.warn('Ошибка проверки Service Worker:', error)
          })
      }
      
      // Начинаем проверку
      checkServiceWorker()
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