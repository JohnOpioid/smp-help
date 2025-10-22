/**
 * Плагин для предзагрузки данных поиска при запуске приложения
 * Загружает и кеширует данные для поиска в фоновом режиме
 */

export default defineNuxtPlugin(async () => {
  // Запускаем только на клиенте
  if (!process.client) return

  console.log('🚀 Инициализация предзагрузки данных поиска...')

  try {
    // Импортируем composable для работы с кешем поиска
    const { preloadData, getCacheInfo } = useSearchCache()

    // Проверяем, есть ли уже данные в кеше
    const cacheInfo = getCacheInfo()
    
    if (cacheInfo.cachedData && cacheInfo.cachedData.length > 0) {
      console.log('✅ Данные поиска уже закешированы:', cacheInfo.cachedData.length, 'элементов')
      return
    }

    console.log('📡 Загружаем данные для поиска в фоновом режиме...')
    
    // Загружаем данные в фоновом режиме
    const searchData = await preloadData()
    
    if (searchData && Array.isArray(searchData) && searchData.length > 0) {
      console.log('✅ Данные поиска успешно загружены и закешированы:', searchData.length, 'элементов')
      
      // Показываем уведомление пользователю (опционально)
      if (process.client && window.Capacitor && window.Capacitor.isNativePlatform()) {
        console.log('📱 Android: Данные поиска готовы к использованию')
      }
    } else {
      console.warn('⚠️ Не удалось загрузить данные для поиска')
    }
  } catch (error) {
    console.error('❌ Ошибка при предзагрузке данных поиска:', error)
  }
})
