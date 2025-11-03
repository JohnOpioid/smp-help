export default defineNuxtPlugin(() => {
  if (process.server) return

  // Сохраняем оригинальные методы
  const originalLog = console.log
  const originalWarn = console.warn
  const originalInfo = console.info
  const originalDebug = console.debug

  // Функция для проверки, нужно ли фильтровать сообщение
  const shouldFilter = (args: any[]): boolean => {
    const message = args.map(arg => {
      if (typeof arg === 'string') return arg
      if (arg && typeof arg === 'object') {
        try {
          return JSON.stringify(arg)
        } catch {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')

    // Фильтруем логи от Telegram WebView
    if (message.includes('[Telegram.WebView]')) return true
    if (message.includes('telegram-web-app.js')) return true
    
    // Фильтруем предупреждения о hydration mismatches (только в production)
    if (process.env.NODE_ENV === 'production' && message.includes('Hydration completed but contains mismatches')) return true

    return false
  }

  // Переопределяем console.log
  console.log = (...args: any[]) => {
    if (!shouldFilter(args)) {
      originalLog.apply(console, args)
    }
  }

  // Переопределяем console.warn
  console.warn = (...args: any[]) => {
    if (!shouldFilter(args)) {
      originalWarn.apply(console, args)
    }
  }

  // Переопределяем console.info
  console.info = (...args: any[]) => {
    if (!shouldFilter(args)) {
      originalInfo.apply(console, args)
    }
  }

  // Переопределяем console.debug
  console.debug = (...args: any[]) => {
    if (!shouldFilter(args)) {
      originalDebug.apply(console, args)
    }
  }
})

