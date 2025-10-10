export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) return

  const config = useRuntimeConfig()
  const apiKey = (config.public as any)?.yamapsApiKey || ''
  const src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apiKey ? `&apikey=${encodeURIComponent(apiKey)}` : ''}`

  let loader: Promise<any> | null = null

  function loadYmaps(): Promise<any> {
    if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
    if ((window as any).ymaps) return Promise.resolve((window as any).ymaps)
    if (!loader) {
      loader = new Promise<any>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.async = true
        script.onload = () => {
          ;(window as any).ymaps.ready(() => resolve((window as any).ymaps))
        }
        script.onerror = () => reject(new Error('Yandex Maps failed to load'))
        document.head.appendChild(script)
      })
    }
    return loader
  }

  nuxtApp.provide('ymaps', () => loadYmaps())
  // Экспортируем флаг готовности, если потребуется
  ;(window as any).__yamaps_loader__ = loadYmaps
})


