/**
 * Composable для работы с SEO и функционалом поделиться
 * Предоставляет данные для мета-тегов и URL изображений
 */

export interface SeoShareData {
  title: string
  description: string
  ogImageUrl: string | undefined
  shareImageUrl: string | undefined
  pageUrl: string
  shareText: string
}

export const useSeoShare = (options?: {
  title?: string | (() => string) | ComputedRef<string>
  description?: string | (() => string) | ComputedRef<string>
  imageId?: string | (() => string | undefined) | ComputedRef<string | undefined>
  imageType?: 'codifier' | 'algorithm' | 'test' | 'page'
  sectionName?: string | (() => string) | ComputedRef<string>
}) => {
  const route = useRoute()
  
  // Получаем абсолютный URL (вызываем composables в правильном контексте)
  let baseUrl: string
  if (process.server) {
    const headers = useRequestHeaders()
    const host = headers.host || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    baseUrl = `${protocol}://${host}`
  } else if (process.client) {
    baseUrl = `${window.location.protocol}//${window.location.host}`
  } else {
    baseUrl = process.env.NODE_ENV === 'production' ? 'https://smp-help.ru' : 'http://localhost:3000'
  }
  
  // Вспомогательная функция для получения значения из опций (поддерживает computed, функции и строки)
  const getOptionValue = <T>(option: T | (() => T) | ComputedRef<T> | undefined, defaultValue: T): T => {
    if (!option) return defaultValue
    // Проверяем, является ли это ComputedRef (имеет свойство value и является реактивным)
    if (typeof option === 'object' && 'value' in option && typeof (option as any).value !== 'undefined') {
      return (option as ComputedRef<T>).value
    }
    if (typeof option === 'function') {
      // Проверяем, не является ли это ComputedRef (computed тоже функция)
      try {
        const result = (option as () => T)()
        return result
      } catch {
        return defaultValue
      }
    }
    return option as T
  }
  
  // Получаем ID изображения
  const getImageId = computed(() => {
    const imageIdOption = options?.imageId
    if (imageIdOption) {
      return getOptionValue(imageIdOption, undefined as string | undefined)
    }
    
    // Автоматическое определение ID из route
    const path = route.path || '/'
    const queryId = route.query.id as string | undefined
    
    // Для кодификатора
    if (path.startsWith('/codifier') && queryId) {
      return queryId.trim()
    }
    
    // Для алгоритмов
    if (path.startsWith('/algorithms/')) {
      const segments = path.split('/').filter(Boolean)
      const lastSegment = segments[segments.length - 1]
      if (lastSegment && lastSegment.length >= 20) {
        return lastSegment
      }
    }
    
    // Для тестов
    if (path.startsWith('/tests/')) {
      const segments = path.split('/').filter(Boolean)
      const categoryId = segments[1]
      if (categoryId && categoryId.length >= 20) {
        return categoryId
      }
    }
    
    // Для других страниц (drugs, local-statuses) используем query.id если есть
    if (queryId && queryId.trim().length >= 20) {
      return queryId.trim()
    }
    
    return undefined
  })
  
  // Определяем тип изображения
  const imageType = computed(() => {
    if (options?.imageType) return options.imageType
    
    const path = route.path || '/'
    if (path.startsWith('/codifier')) return 'codifier'
    if (path.startsWith('/algorithms/')) return 'algorithm'
    if (path.startsWith('/tests/')) return 'test'
    return 'page'
  })
  
  // Получаем название раздела
  const getSectionName = computed(() => {
    const sectionNameOption = options?.sectionName
    if (sectionNameOption) {
      return getOptionValue(sectionNameOption, '')
    }
    
    const path = route.path || '/'
    if (path.startsWith('/codifier')) return 'Кодификатор'
    if (path.startsWith('/algorithms')) return 'Алгоритмы'
    if (path.startsWith('/tests')) return 'Тесты'
    if (path.startsWith('/calculators')) return 'Калькуляторы'
    if (path.startsWith('/classroom/instructions')) return 'Инструкции'
    if (path.startsWith('/apps')) return 'Приложения'
    if (path.startsWith('/drugs')) return 'Лекарственные средства'
    return 'Справочник СМП'
  })
  
  // URL для OG изображения (для мета-тегов)
  const ogImageUrl = computed(() => {
    const imageId = getImageId.value
    const type = imageType.value
    
    if (type === 'codifier' && imageId) {
      return `${baseUrl}/api/codifier/og-image/${imageId}?v=${imageId}`
    }
    
    // Для страниц с ID используем общий endpoint с ID в версии
    if (imageId) {
      const path = route.path || '/'
      return `${baseUrl}/api/og-image/page?path=${encodeURIComponent(path)}&v=${imageId}`
    }
    
    // Для страниц без ID используем общий endpoint
    const path = route.path || '/'
    const v = path.replace(/\//g, '_') || 'home'
    return `${baseUrl}/api/og-image/page?path=${encodeURIComponent(path)}&v=${v}`
  })
  
  // URL для превью в попапе (с параметрами размера)
  const shareImageUrl = computed(() => {
    const imageId = getImageId.value
    const type = imageType.value
    
    if (type === 'codifier' && imageId) {
      return `${baseUrl}/api/codifier/og-image/${imageId}?v=${imageId}&w=900&h=600`
    }
    
    // Для страниц с ID используем общий endpoint с ID в версии
    if (imageId) {
      const path = route.path || '/'
      return `${baseUrl}/api/og-image/page?path=${encodeURIComponent(path)}&v=${imageId}&w=900&h=600`
    }
    
    // Для страниц без ID используем общий endpoint
    const path = route.path || '/'
    const v = path.replace(/\//g, '_') || 'home'
    return `${baseUrl}/api/og-image/page?path=${encodeURIComponent(path)}&v=${v}&w=900&h=600`
  })
  
  // Заголовок страницы
  const title = computed(() => {
    const titleOption = options?.title
    if (titleOption) {
      return getOptionValue(titleOption, '')
    }
    return getSectionName.value
  })
  
  // Описание страницы
  const description = computed(() => {
    const descriptionOption = options?.description
    if (descriptionOption) {
      return getOptionValue(descriptionOption, '')
    }
    return ''
  })
  
  // URL страницы
  const pageUrl = computed(() => {
    if (process.client) {
      return window.location.href
    }
    return `${baseUrl}${route.fullPath}`
  })
  
  // Текст для поделиться (название + ссылка через строку)
  const shareText = computed(() => {
    const titleText = title.value
    const url = pageUrl.value
    return `${titleText}\n\n${url}`
  })
  
  // Данные для SEO
  const seoData = computed<SeoShareData>(() => ({
    title: title.value,
    description: description.value,
    ogImageUrl: ogImageUrl.value,
    shareImageUrl: shareImageUrl.value,
    pageUrl: pageUrl.value,
    shareText: shareText.value
  }))
  
  return {
    seoData,
    title,
    description,
    ogImageUrl,
    shareImageUrl,
    pageUrl,
    shareText,
    getSectionName,
    getImageId
  }
}

