export default defineNuxtPlugin(() => {
  // Регистрация PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker зарегистрирован:', registration.scope)
          
          // Проверка обновлений
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Новое обновление доступно - отправляем сообщение компоненту
                  console.log('🔄 Доступно новое обновление')
                  window.dispatchEvent(new CustomEvent('pwa-update-available'))
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ Ошибка регистрации Service Worker:', error)
        })
    })
  }

  // Обработка офлайн/онлайн статуса
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine
    document.body.classList.toggle('offline', !isOnline)
    
    if (!isOnline) {
      console.log('📱 Приложение работает в офлайн режиме')
    } else {
      console.log('🌐 Приложение подключено к интернету')
    }
  }

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  updateOnlineStatus()

  // Показ уведомления об установке PWA
  let deferredPrompt: any = null

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    
    // Показываем кнопку установки
    const installButton = document.createElement('button')
    installButton.textContent = '📱 Установить приложение'
    installButton.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 pwa-install-button'
    installButton.onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log(`Пользователь ${outcome === 'accepted' ? 'принял' : 'отклонил'} установку`)
        deferredPrompt = null
        installButton.remove()
      }
    }
    
    document.body.appendChild(installButton)
    
    // Автоматически скрываем кнопку через 10 секунд
    setTimeout(() => {
      if (installButton.parentNode) {
        installButton.remove()
      }
    }, 10000)
  })

  // Обработка успешной установки
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA успешно установлено')
    deferredPrompt = null
  })
})
