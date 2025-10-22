export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const VERSION_KEY = 'app_version'
  const CHECK_INTERVAL_MS = 60_000 // 1 минута

  let stopTimer: number | null = null
  const versionState = useState<string>(VERSION_KEY, () => '')

  const checkVersion = async () => {
    try {
      const res: any = await $fetch(`${config.public.apiBase}/version`, { cache: 'no-cache' as any })
      const serverVersion = String(res?.version || '')
      if (!serverVersion) return

      const clientVersion = localStorage.getItem(VERSION_KEY)
      if (!clientVersion) {
        localStorage.setItem(VERSION_KEY, serverVersion)
        versionState.value = serverVersion
        return
      }

      if (clientVersion && clientVersion !== serverVersion) {
        // Новая версия: мягкое обновление страницы
        localStorage.setItem(VERSION_KEY, serverVersion)
        versionState.value = serverVersion
        try {
          // @ts-ignore Nuxt UI toast
          const toast = (nuxtApp as any).$ui?.toast || (window as any).useToast?.()
          toast?.add?.({ title: 'Доступно обновление', description: 'Приложение обновится…', color: 'primary' })
        } catch {}
        // Перезагружаем без кеша
        window.location.reload()
      }
      // Обновим state даже если версия не изменилась — для первого показа
      if (!versionState.value) versionState.value = clientVersion
    } catch {}
  }

  // Первый запуск сразу
  checkVersion()
  // Периодическая проверка
  stopTimer = window.setInterval(checkVersion, CHECK_INTERVAL_MS)

  // Очищаем таймер при навигации/разрушении
  nuxtApp.hook('app:beforeUnmount', () => {
    if (stopTimer) clearInterval(stopTimer)
  })
})


