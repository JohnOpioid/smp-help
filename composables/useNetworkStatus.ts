// Глобальное состояние сети
let globalIsOnline = ref(true)
let globalIsChecking = ref(false)
let globalLastCheckTime = 0
let isInitialized = false

// Минимальный интервал между проверками (5 секунд)
const CHECK_INTERVAL = 5000

// Функция проверки подключения к интернету
const checkConnection = async (): Promise<boolean> => {
  const now = Date.now()
  
  // Если уже проверяем или прошло мало времени с последней проверки
  if (globalIsChecking.value || (now - globalLastCheckTime) < CHECK_INTERVAL) {
    return globalIsOnline.value
  }
  
  globalIsChecking.value = true
  globalLastCheckTime = now
  
  try {
    // Сначала проверяем navigator.onLine
    if (!navigator.onLine) {
      globalIsOnline.value = false
      return false
    }
    
    // Дополнительная проверка через fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    // Пробуем разные эндпоинты для проверки
    const endpoints = [
      '/', // Главная страница
      '/favicon.ico' // Статический файл
    ]
    
    let connectionSuccess = false
    
    for (const endpoint of endpoints) {
      try {
        await fetch(endpoint, {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
          mode: 'no-cors'
        })
        connectionSuccess = true
        break
      } catch (error) {
        // Пробуем следующий эндпоинт
        continue
      }
    }
    
    clearTimeout(timeoutId)
    globalIsOnline.value = connectionSuccess
    return connectionSuccess
    
  } catch (error) {
    globalIsOnline.value = false
    return false
  } finally {
    globalIsChecking.value = false
  }
}

// Обработчики событий сети
const handleOnline = async () => {
  // При событии 'online' сразу проверяем соединение
  await checkConnection()
}

const handleOffline = () => {
  globalIsOnline.value = false
}

// Инициализация глобальных обработчиков
function initializeGlobalHandlers() {
  if (isInitialized || !process.client) return
  
  isInitialized = true
  
  // Первоначальная проверка
  checkConnection()
  
  // Слушаем события сети
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
}

export const useNetworkStatus = () => {
  // Инициализируем глобальные обработчики при первом использовании
  initializeGlobalHandlers()
  
  // Обработчики для компонентов (если нужно)
  const handleComponentOnline = async () => {
    await checkConnection()
  }
  
  const handleComponentOffline = () => {
    globalIsOnline.value = false
  }
  
  // Инициализация для компонентов
  if (process.client) {
    onMounted(async () => {
      // Первоначальная проверка для компонента
      await checkConnection()
      
      // Слушаем события сети для компонента
      window.addEventListener('online', handleComponentOnline)
      window.addEventListener('offline', handleComponentOffline)
    })
    
    // Очистка для компонентов
    onUnmounted(() => {
      window.removeEventListener('online', handleComponentOnline)
      window.removeEventListener('offline', handleComponentOffline)
    })
  }
  
  return {
    isOnline: readonly(globalIsOnline),
    isChecking: readonly(globalIsChecking),
    checkConnection
  }
}
