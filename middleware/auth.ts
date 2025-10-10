export default defineNuxtRouteMiddleware(async () => {
  try {
    const opts: any = { credentials: 'include' }
    if (process.server) {
      const headers = useRequestHeaders(['cookie'])
      opts.headers = { cookie: headers.cookie as string }
    }
    const res: any = await $fetch('/api/auth/me', opts)
    if (!res?.user) {
      return navigateTo('/auth/login')
    }
  } catch {
    return navigateTo('/auth/login')
  }
})
