export default defineNuxtPlugin(() => {
  const route = useRoute()

  const computeTitle = () => {
    const p = route.path || '/'
    const q = route.query || {}

    // Не вмешиваемся в детальные страницы кодификатора с ?id
    if (p.startsWith('/codifier') && typeof q.id === 'string' && q.id) {
      return undefined
    }

    const site = 'Справочник СМП'

    if (p === '/' || p === '') return site

    // Разделы с вложенностью
    if (p.startsWith('/algorithms')) return `${site} — Алгоритмы`
    if (p.startsWith('/calculators')) return `${site} — Калькуляторы`
    if (p.startsWith('/classroom/instructions')) return `${site} — Инструкции`
    if (p.startsWith('/apps')) return `${site} — Приложения`
    if (p.startsWith('/favorites') || p.startsWith('/profile/bookmarks')) return `${site} — Избранное`
    if (p.startsWith('/profile')) return `${site} — Профиль`
    if (p.startsWith('/about')) return `${site} — О проекте`
    if (p.startsWith('/contacts')) return `${site} — Контакты`
    if (p.startsWith('/privacy')) return `${site} — Конфиденциальность`
    if (p.startsWith('/updates')) return `${site} — Обновления`
    if (p.startsWith('/help')) return `${site} — Помощь`
    if (p.startsWith('/promo')) return `${site} — Промо`
    if (p.startsWith('/substations')) return `${site} — Подстанции`
    if (p.startsWith('/local-statuses')) return `${site} — Локальные статусы`
    if (p.startsWith('/drugs')) return `${site} — Лекарственные средства`
    if (p.startsWith('/codifier')) return `${site} — Кодификатор`

    // По умолчанию — сайт
    return site
  }

  const applyTitle = () => {
    const title = computeTitle()
    if (!title) return
    useHead({ title })
  }

  if (process.server) {
    applyTitle()
  }
  if (process.client) {
    watch(() => route.fullPath, () => applyTitle(), { immediate: true })
  }
})
