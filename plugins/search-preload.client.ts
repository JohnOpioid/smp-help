/**
 * Плагин для предзагрузки данных поиска при запуске приложения
 * Загружает и кеширует данные для поиска в фоновом режиме
 */

export default defineNuxtPlugin(async () => {
  // ВРЕМЕННО ОТКЛЮЧЕНО: Плагин предзагрузки замедляет загрузку приложения
  // Запускаем только на клиенте
  if (!process.client) return

  console.log('🔧 Search preload plugin disabled for performance')
  return

  // try {
  //   // Импортируем composable для работы с кешем поиска
  //   const { preloadData, getCacheInfo } = useSearchCache()

  //   // Проверяем, есть ли уже данные в кеше
  //   const cacheInfo = getCacheInfo()
    
  //   if (cacheInfo.cachedData && cacheInfo.cachedData.data && cacheInfo.cachedData.data.length > 0) {
  //     return
  //   }

  //   // Загружаем данные в фоновом режиме
  //   const searchData = await preloadData()
    
  //   if (searchData && Array.isArray(searchData) && searchData.length > 0) {
  //     // Данные успешно загружены
      
  //     // Показываем уведомление пользователю (опционально)
  //     if (process.client && window.Capacitor && window.Capacitor.isNativePlatform()) {
  //       // Android приложение готово к работе
  //     }
  //   } else {
  //     console.warn('⚠️ Не удалось загрузить данные для поиска')
  //   }
  // } catch (error) {
  //   console.error('❌ Ошибка при предзагрузке данных поиска:', error)
  // }
})
