import { ref, nextTick } from 'vue'

// Глобальное состояние предзагрузки
const isPreloading = ref(false)
const preloadProgress = ref(0)
const preloadMessage = ref('')

// Кэш для предзагруженных данных
const preloadCache = new Map<string, any>()

// Интерфейс для конфигурации предзагрузки
interface PreloadConfig {
  url: string
  preloadFn?: () => Promise<any>
  cacheKey?: string
  showProgress?: boolean
  message?: string
}

// Основная функция предзагрузки
export const usePreloader = () => {
  const startPreload = async (config: PreloadConfig) => {
    const { url, preloadFn, cacheKey, showProgress = true, message = 'Загрузка...' } = config
    
    console.log('🚀 startPreload вызвана:', { url, showProgress, message, hasCache: cacheKey ? preloadCache.has(cacheKey) : false })
    
    try {
      isPreloading.value = true
      preloadProgress.value = 0
      preloadMessage.value = message
      
      console.log('📊 Устанавливаем состояние предзагрузки:', { isPreloading: isPreloading.value, progress: preloadProgress.value })
      
      // Показываем прогресс
      if (showProgress) {
        preloadProgress.value = 20
        await nextTick()
        // Минимальная задержка для показа прогресса
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('📈 Прогресс установлен на 20%')
      }
      
      // Если данные уже в кэше, все равно показываем прогресс
      if (cacheKey && preloadCache.has(cacheKey)) {
        preloadProgress.value = 80
        await new Promise(resolve => setTimeout(resolve, 100))
        preloadProgress.value = 100
        await new Promise(resolve => setTimeout(resolve, 200))
        await navigateTo(url)
        return
      }
      
      // Выполняем предзагрузку
      if (preloadFn) {
        preloadProgress.value = 50
        const data = await preloadFn()
        
        // Сохраняем в кэш
        if (cacheKey) {
          preloadCache.set(cacheKey, data)
        }
        
        preloadProgress.value = 80
        // Небольшая задержка для плавности
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      preloadProgress.value = 100
      
      // Небольшая задержка для показа завершения
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Переходим на страницу
      await navigateTo(url)
      
    } catch (error) {
      console.error('Ошибка предзагрузки:', error)
      // В случае ошибки все равно переходим
      await navigateTo(url)
    } finally {
      isPreloading.value = false
      preloadProgress.value = 0
      preloadMessage.value = ''
    }
  }
  
  const preloadData = async (key: string, fn: () => Promise<any>) => {
    if (preloadCache.has(key)) {
      return preloadCache.get(key)
    }
    
    try {
      const data = await fn()
      preloadCache.set(key, data)
      return data
    } catch (error) {
      console.error('Ошибка предзагрузки данных:', error)
      return null
    }
  }
  
  const clearCache = (key?: string) => {
    if (key) {
      preloadCache.delete(key)
    } else {
      preloadCache.clear()
    }
  }
  
  const getCacheSize = () => preloadCache.size
  
  return {
    isPreloading: readonly(isPreloading),
    preloadProgress: readonly(preloadProgress),
    preloadMessage: readonly(preloadMessage),
    startPreload,
    preloadData,
    clearCache,
    getCacheSize
  }
}

// Глобальные функции для удобного использования
export const preloadAndNavigate = async (url: string, preloadFn?: () => Promise<any>, options?: Partial<PreloadConfig>) => {
  const { startPreload } = usePreloader()
  
  console.log('🎯 preloadAndNavigate вызвана для:', url, 'с опциями:', options)
  
  await startPreload({
    url,
    preloadFn,
    showProgress: true,
    message: 'Загрузка...',
    ...options
  })
}

// Предзагрузка для конкретных типов страниц
export const preloadPage = {
  // Предзагрузка страницы алгоритмов
  algorithm: async (section: string, category: string, algorithmId?: string) => {
    const url = algorithmId 
      ? `/algorithms/${section}/${category}/${algorithmId}`
      : `/algorithms/${section}/${category}`
    
    await preloadAndNavigate(url, async () => {
      await $fetch(`/api/algorithms/${section}/${category}`)
    }, {
      cacheKey: `algo-${section}-${category}`,
      message: 'Загрузка алгоритма...'
    })
  },
  
  // Предзагрузка страницы кодификатора
  codifier: async (categoryUrl: string, mkbId?: string) => {
    const url = mkbId 
      ? `/codifier/${categoryUrl}?id=${mkbId}`
      : `/codifier/${categoryUrl}`
    
    await preloadAndNavigate(url, async () => {
      await $fetch(`/api/codifier/${categoryUrl}`)
    }, {
      cacheKey: `codifier-${categoryUrl}`,
      message: 'Загрузка кодификатора...'
    })
  },
  
  // Предзагрузка страницы локальных статусов
  localStatus: async (categoryUrl: string, statusId?: string) => {
    const url = statusId 
      ? `/local-statuses/${categoryUrl}?id=${statusId}`
      : `/local-statuses/${categoryUrl}`
    
    await preloadAndNavigate(url, async () => {
      await $fetch(`/api/local-statuses/${categoryUrl}`)
    }, {
      cacheKey: `ls-${categoryUrl}`,
      message: 'Загрузка статуса...'
    })
  },
  
  // Предзагрузка страницы препаратов
  drug: async (drugId?: string) => {
    const url = drugId ? `/drugs?id=${drugId}` : '/drugs'
    
    await preloadAndNavigate(url, async () => {
      await $fetch('/api/drugs')
    }, {
      cacheKey: 'drugs',
      message: 'Загрузка препаратов...'
    })
  },
  
  // Предзагрузка страницы подстанций
  substation: async (substationName?: string) => {
    const url = substationName 
      ? `/substations?select=${encodeURIComponent(substationName)}`
      : '/substations'
    
    await preloadAndNavigate(url, async () => {
      await $fetch('/api/substations')
    }, {
      cacheKey: 'substations',
      message: 'Загрузка подстанций...'
    })
  },
  
  // Предзагрузка страницы инструкций
  instruction: async (instructionId?: string) => {
    const url = instructionId ? `/instructions?id=${instructionId}` : '/instructions'
    
    await preloadAndNavigate(url, async () => {
      await $fetch('/api/instructions')
    }, {
      cacheKey: 'instructions',
      message: 'Загрузка инструкций...'
    })
  }
}

// Автоматическая предзагрузка при наведении и клике на ссылки
export const useAutoPreload = () => {
  const setupAutoPreload = () => {
    if (process.client) {
      let preloadTimeout: NodeJS.Timeout | null = null
      
      // Функция для выполнения предзагрузки
      const performPreload = async (href: string) => {
        try {
          console.log('🚀 Начинаем предзагрузку для:', href)
          
          // Определяем тип страницы по URL
          if (href.includes('/algorithms/')) {
            const match = href.match(/\/algorithms\/([^/]+)\/([^/]+)(?:\/([^/?]+))?/)
            if (match) {
              const [, section, category, algorithmId] = match
              await preloadPage.algorithm(section, category, algorithmId)
            }
          } else if (href.includes('/codifier/')) {
            const match = href.match(/\/codifier\/([^/?]+)/)
            if (match) {
              const [, categoryUrl] = match
              await preloadPage.codifier(categoryUrl)
            }
          } else if (href.includes('/local-statuses/')) {
            const match = href.match(/\/local-statuses\/([^/?]+)/)
            if (match) {
              const [, categoryUrl] = match
              await preloadPage.localStatus(categoryUrl)
            }
          } else if (href.includes('/drugs')) {
            await preloadPage.drug()
          } else if (href.includes('/substations')) {
            await preloadPage.substation()
          } else if (href.includes('/instructions')) {
            await preloadPage.instruction()
          }
        } catch (error) {
          console.error('❌ Ошибка в performPreload:', error)
        }
      }
      
      // Предзагрузка при наведении на ссылки
      document.addEventListener('mouseenter', async (e) => {
        try {
          const target = e.target as HTMLElement
          
          // Проверяем, что target является элементом и имеет метод closest
          if (target && typeof target.closest === 'function') {
            const link = target.closest('a[href]') as HTMLAnchorElement
            
            if (link && link.href && !link.href.startsWith('http')) {
              const href = link.href
              
              console.log('🖱️ Наведение на ссылку:', href)
              
              // Очищаем предыдущий таймер
              if (preloadTimeout) {
                clearTimeout(preloadTimeout)
              }
              
              // Добавляем небольшую задержку перед предзагрузкой
              preloadTimeout = setTimeout(async () => {
                await performPreload(href)
              }, 300) // 300ms задержка
            }
          }
        } catch (error) {
          console.error('❌ Ошибка в обработчике наведения:', error)
        }
      }, { passive: true })
      
      // Предзагрузка при клике на ссылки (сразу, без задержки)
      document.addEventListener('click', async (e) => {
        try {
          const target = e.target as HTMLElement
          
          // Проверяем, что target является элементом и имеет метод closest
          if (target && typeof target.closest === 'function') {
            const link = target.closest('a[href]') as HTMLAnchorElement
            
            if (link && link.href && !link.href.startsWith('http')) {
              const href = link.href
              
              console.log('🖱️ Клик по ссылке:', href)
              
              // Очищаем таймер наведения
              if (preloadTimeout) {
                clearTimeout(preloadTimeout)
              }
              
              // Выполняем предзагрузку сразу при клике
              await performPreload(href)
            }
          }
        } catch (error) {
          console.error('❌ Ошибка в обработчике клика:', error)
        }
      }, { passive: true })
    }
  }
  
  return {
    setupAutoPreload
  }
}

// Тестовая функция для проверки прогресс-бара
export const testPreloader = async () => {
  const { startPreload } = usePreloader()
  
  await startPreload({
    url: '/',
    preloadFn: async () => {
      // Имитируем загрузку
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { test: 'data' }
    },
    message: 'Тестовая загрузка...',
    showProgress: true
  })
}

// Глобальная функция для тестирования в консоли браузера
if (process.client) {
  (window as any).testPreloader = testPreloader
  (window as any).testCodifierPreload = async () => {
    await preloadPage.codifier('cardiology')
  }
  (window as any).checkPreloaderState = () => {
    console.log('📊 Состояние предзагрузки:', {
      isPreloading: isPreloading.value,
      progress: preloadProgress.value,
      message: preloadMessage.value,
      cacheSize: preloadCache.size
    })
  }
}
