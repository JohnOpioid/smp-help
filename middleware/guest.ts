export default defineNuxtRouteMiddleware(async () => {
  try {
    // Если нет токена, не делаем запрос и не шумим в консоли
    if (process.server) {
      const headers = useRequestHeaders(['cookie'])
      const cookie = (headers.cookie || '') as string
      if (!cookie.includes('token=')) return
      const res: any = await $fetch('/api/auth/me', { credentials: 'include', headers: { cookie } })
      if (res?.user) return navigateTo('/')
    } else {
      const token = useCookie<string | null>('token').value
      if (!token) return
      const res: any = await $fetch('/api/auth/me', { credentials: 'include' })
      if (res?.user) return navigateTo('/')
    }
  } catch {}
})
