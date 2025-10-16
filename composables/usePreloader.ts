import { ref, nextTick } from 'vue'

// Глобальное состояние предзагрузки - создаем один раз
const globalPreloaderState = {
  isPreloading: ref(false),
  preloadProgress: ref(0),
  preloadMessage: ref(''),
  cache: new Map<string, any>()
}

// Экспортируем глобальные refs для прямого доступа
export const isPreloading = globalPreloaderState.isPreloading
export const preloadProgress = globalPreloaderState.preloadProgress
export const preloadMessage = globalPreloaderState.preloadMessage
export const preloadCache = globalPreloaderState.cache

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
      
      // Принудительно обновляем DOM
      await nextTick()
      
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
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))
        preloadProgress.value = 100
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 200))
        await navigateTo(url)
        return
      }
      
      // Выполняем предзагрузку
      if (preloadFn) {
        preloadProgress.value = 50
        await nextTick()
        const data = await preloadFn()
        
        // Сохраняем в кэш
        if (cacheKey) {
          preloadCache.set(cacheKey, data)
        }
        
        preloadProgress.value = 80
        await nextTick()
        // Небольшая задержка для плавности
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      preloadProgress.value = 100
      await nextTick()
      
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
    isPreloading,
    preloadProgress,
    preloadMessage,
    startPreload,
    preloadData,
    clearCache,
    getCacheSize
  }
}

// Глобальные функции для удобного использования
export const preloadAndNavigate = async (url: string, preloadFn?: () => Promise<any>, options?: Partial<PreloadConfig>) => {
  const { url: finalUrl, preloadFn: finalPreloadFn, cacheKey, showProgress = true, message = 'Загрузка...' } = {
    url,
    preloadFn,
    showProgress: true,
    message: 'Загрузка...',
    ...options
  }

  try {
    isPreloading.value = true
    preloadProgress.value = 0
    preloadMessage.value = message
    
    // Принудительно обновляем DOM
    await nextTick()
    
    // Показываем прогресс
    if (showProgress) {
      preloadProgress.value = 20
      await nextTick()
      // Минимальная задержка для показа прогресса
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Если данные уже в кэше, все равно показываем прогресс
    if (cacheKey && preloadCache.has(cacheKey)) {
      preloadProgress.value = 80
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 300))
      preloadProgress.value = 100
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 500))
      await navigateTo(finalUrl)
      return
    }

    // Выполняем предзагрузку
    if (finalPreloadFn) {
      preloadProgress.value = 50
      await nextTick()
      const data = await finalPreloadFn()

      // Сохраняем в кэш
      if (cacheKey) {
        preloadCache.set(cacheKey, data)
      }

      preloadProgress.value = 80
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    preloadProgress.value = 100
    await nextTick()

    // Увеличиваем задержку для показа завершения
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // Переходим на страницу
    await navigateTo(finalUrl)

  } catch (error) {
    console.error('Ошибка предзагрузки:', error)
    // В случае ошибки все равно переходим
    await navigateTo(finalUrl)
  } finally {
    isPreloading.value = false
    preloadProgress.value = 0
    preloadMessage.value = ''
  }
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
      let lastPreloadUrl: string | null = null
      let preloadInProgress = false
      
      // Функция для выполнения предзагрузки
      const performPreload = async (href: string) => {
        try {
          // Проверяем, не выполняется ли уже предзагрузка для этого URL
          if (preloadInProgress && lastPreloadUrl === href) {
            return
          }

          preloadInProgress = true
          lastPreloadUrl = href

          // Извлекаем путь из полного URL
          const url = new URL(href)
          const pathname = url.pathname

          let shouldPreload = false

          // Определяем тип страницы по URL
          if (pathname.includes('/algorithms/')) {
            const match = pathname.match(/\/algorithms\/([^/]+)(?:\/([^/?]+))?(?:\/([^/?]+))?/)
            if (match) {
              const [, section, category, algorithmId] = match
              // Для главных страниц разделов (без категории) не делаем предзагрузку
              if (category && category !== 'undefined') {
                await preloadPage.algorithm(section, category, algorithmId)
                shouldPreload = true
              }
            }
          } else if (pathname.includes('/codifier/')) {
            const match = pathname.match(/\/codifier\/([^/?]+)/)
            if (match) {
              const [, categoryUrl] = match
              await preloadPage.codifier(categoryUrl)
              shouldPreload = true
            }
          } else if (pathname.includes('/local-statuses/')) {
            const match = pathname.match(/\/local-statuses\/([^/?]+)/)
            if (match) {
              const [, categoryUrl] = match
              await preloadPage.localStatus(categoryUrl)
              shouldPreload = true
            }
          } else if (pathname.includes('/drugs')) {
            await preloadPage.drug()
            shouldPreload = true
          } else if (pathname.includes('/substations')) {
            await preloadPage.substation()
            shouldPreload = true
          } else if (pathname.includes('/instructions')) {
            await preloadPage.instruction()
            shouldPreload = true
          }

          // Если предзагрузка не выполнялась, показываем прогресс-бар и переходим на страницу
          if (!shouldPreload) {
            // Показываем прогресс-бар даже для страниц без предзагрузки
            await preloadAndNavigate(pathname, undefined, {
              showProgress: true,
              message: 'Переход на страницу...'
            })
          }
        } catch (error) {
          console.error('Ошибка предзагрузки:', error)
          // В случае ошибки все равно переходим на страницу
          const url = new URL(href)
          await navigateTo(url.pathname)
        } finally {
          preloadInProgress = false
        }
      }
      
      // Предзагрузка при наведении на ссылки
      document.addEventListener('mouseenter', async (e) => {
        try {
          const target = e.target as HTMLElement
          
          // Проверяем, что target является элементом и имеет метод closest
          if (target && typeof target.closest === 'function') {
            const link = target.closest('a[href]') as HTMLAnchorElement
            
          if (link && link.href && (!link.href.startsWith('http') || link.href.includes(window.location.hostname))) {
            const href = link.href
            
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
          // Предотвращаем множественные обработки одного клика
          if (e.defaultPrevented) {
            return
          }
          
          const target = e.target as HTMLElement
          
          // Проверяем, что target является элементом и имеет метод closest
          if (target && typeof target.closest === 'function') {
            const link = target.closest('a[href]') as HTMLAnchorElement
            
            if (link && link.href && (!link.href.startsWith('http') || link.href.includes(window.location.hostname))) {
              const href = link.href
              
              // Проверяем, не выполняется ли уже предзагрузка для этого URL
              if (preloadInProgress && lastPreloadUrl === href) {
                return
              }
              
              // Предотвращаем дальнейшую обработку события
              e.preventDefault()
              e.stopPropagation()
              
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
      }, { passive: false, capture: true })
    }
  }
  
  return {
    setupAutoPreload
  }
}

// Глобальная функция для тестирования в консоли браузера
if (process.client) {
  (window as any).checkPreloaderState = () => {
    console.log('📊 Состояние предзагрузки:', {
      isPreloading: isPreloading.value,
      progress: preloadProgress.value,
      message: preloadMessage.value,
      cacheSize: preloadCache.size
    })
  }
  
  // Функция для принудительного тестирования прогресс-бара
  (window as any).testProgressBar = async () => {
    console.log('🧪 Тестируем прогресс-бар...')
    console.log('🎯 ПРИНУДИТЕЛЬНО ПОКАЗЫВАЕМ ПРОГРЕСС-БАР!')
    
    isPreloading.value = true
    preloadProgress.value = 0
    preloadMessage.value = 'Тестовая загрузка...'
    
    console.log('📊 Установлено состояние:', { isPreloading: isPreloading.value, progress: preloadProgress.value })
    
    // Принудительно обновляем DOM
    await nextTick()
    
    for (let i = 0; i <= 100; i += 10) {
      preloadProgress.value = i
      console.log(`📈 Прогресс: ${i}%`)
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    isPreloading.value = false
    preloadProgress.value = 0
    preloadMessage.value = ''
    
    console.log('✅ Тест прогресс-бара завершен')
  }
  
  // Функция для проверки настроек автоматической предзагрузки
  (window as any).checkAutoPreloadSetup = () => {
    console.log('🔧 Проверяем настройки автоматической предзагрузки...')
    console.log('📊 Количество обработчиков клика:', document.querySelectorAll('a[href]').length)
    console.log('📊 Примеры ссылок:', Array.from(document.querySelectorAll('a[href]')).slice(0, 5).map(a => a.href))
  }
}
