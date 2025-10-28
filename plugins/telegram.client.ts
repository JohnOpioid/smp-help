export default defineNuxtPlugin(() => {
  if (process.server) return

  const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
    if ((window as any).Telegram?.WebApp) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.crossOrigin = 'anonymous'
    ;(s as any).referrerPolicy = 'no-referrer'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`script load failed: ${src}`))
    document.head.appendChild(s)
  })

  // Пытаемся грузить с таймаутом и запасным источником
  const withTimeout = (p: Promise<void>, ms = 10000) => new Promise<void>((resolve) => {
    const t = setTimeout(() => resolve(), ms)
    p.then(() => { clearTimeout(t); resolve() }).catch(() => { clearTimeout(t); resolve() })
  })

  const tryLoad = async () => {
    if ((window as any).Telegram?.WebApp) return
    // 1) Официальный источник
    await withTimeout(loadScript('https://telegram.org/js/telegram-web-app.js'), 10000)
    if ((window as any).Telegram?.WebApp) return
    // 2) jsDelivr (npm)
    await withTimeout(loadScript('https://cdn.jsdelivr.net/npm/@twa-dev/sdk@latest/dist/twa.min.js'), 10000)
    if ((window as any).Telegram?.WebApp) return
    // 3) unpkg (npm)
    await withTimeout(loadScript('https://unpkg.com/@twa-dev/sdk@latest/dist/twa.min.js'), 10000)
    if ((window as any).Telegram?.WebApp) return
    // 4) Локальный стаб, чтобы не было ошибок
    await loadScript('/vendor/twa-stub.js')

    // Если так и не загрузилось — создаём безопасный стаб, чтобы не было ошибок в коде
    const w: any = window as any
    w.Telegram = w.Telegram || {}
    w.Telegram.WebApp = w.Telegram.WebApp || {}
  }

  tryLoad()
})


