export default defineNuxtPlugin(() => {
  if (!process.client || !('serviceWorker' in navigator)) return

  // В режиме разработки полностью отключаем SW и удаляем любые старые регистрации
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {})
    return
  }

  // Обработка ошибок Service Worker
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('ServiceWorker')) {
      console.warn('⚠️ Ошибка Service Worker:', event.message)
      // При ошибке SW пытаемся перезарегистрировать
      setTimeout(() => {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister().then(() => {
              console.log('🔄 Service Worker перерегистрирован')
            })
          })
        })
      }, 5000)
    }
  })

  if (process.client && 'serviceWorker' in navigator) {
    // Ждем готовности DOM и Nuxt PWA
    nextTick(() => {
      // Проверяем наличие зарегистрированного service worker
      const checkServiceWorker = () => {
        navigator.serviceWorker.getRegistration()
          .then((registration) => {
            if (registration) {
              console.log('Service Worker найден:', registration)
              
              // Принудительно проверяем обновления
              registration.update()
              
              // Проверяем наличие обновлений
              registration.addEventListener('updatefound', () => {
                console.log('🔄 Обнаружено обновление service worker')
                const newWorker = registration.installing
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    console.log('📱 Состояние нового service worker:', newWorker.state)
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      // Новый service worker установлен и готов к активации
                      console.log('✅ Доступно обновление PWA')
                      window.dispatchEvent(new CustomEvent('pwa-update-available'))
                    }
                  })
                }
              })
              
              // Проверяем наличие ожидающего service worker
              if (registration.waiting) {
                console.log('⏳ Обнаружен ожидающий service worker')
                window.dispatchEvent(new CustomEvent('pwa-update-available'))
              }
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
      
      // Периодически проверяем обновления (каждые 30 секунд)
      setInterval(() => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update()
          }
        })
      }, 30000)
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