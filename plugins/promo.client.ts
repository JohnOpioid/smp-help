export default defineNuxtPlugin((nuxtApp) => {
  try {
    console.log('[promo] plugin init')
    const promoState = useState<any>('active_promo', () => null)
    const userCompletedState = useState<boolean>('promo_user_completed', () => false)

    function isActiveByDate(ev: any): boolean {
      try {
        if (!ev) return false
        const now = Date.now()
        const start = ev.startAt ? new Date(ev.startAt).getTime() : 0
        const end = ev.endAt ? new Date(ev.endAt).getTime() : 0
        return (!!ev.published) && (!!start ? now >= start : true) && (!!end ? now <= end : true)
      } catch { return false }
    }

    async function loadActive() {
      console.log('[promo] loadActive: fetching /api/promo/active')
      try {
        const res: any = await $fetch('/api/promo/active', { cache: 'no-cache' as any })
        const event = res?.item
        promoState.value = event || null
        console.log('[promo] loadActive: result', !!event ? { _id: event._id, slug: event.slug, spriteIcon: event.spriteIcon } : 'no active')
        try {
          if (event) localStorage.setItem('active_promo_item', JSON.stringify(event))
          else localStorage.removeItem('active_promo_item')
        } catch {}
        // При смене активного ивента восстановим флаг завершения из localStorage
        try {
          if (event?._id) {
            const k = `promo_completed_${event._id}`
            userCompletedState.value = localStorage.getItem(k) === '1'
          } else {
            userCompletedState.value = false
          }
        } catch {}
        return event
      } catch (err) {
        console.error('[promo] loadActive failed', err)
        return null
      }
    }
    // Быстрый старт из localStorage (если есть)
    try {
      const raw = localStorage.getItem('active_promo_item')
      if (raw) {
        const cached = JSON.parse(raw)
        if (isActiveByDate(cached)) {
          promoState.value = cached
          console.log('[promo] init from localStorage:', { _id: cached._id, slug: cached.slug })
        }
      }
    } catch {}

    // Реактивное обновление при изменении в админке (через localStorage)
    window.addEventListener('storage', async (e) => {
      if (e.key === 'promo_updated') {
        console.log('[promo] storage promo_updated:', e.newValue)
        await loadActive()
      }
    })

    // Обновляем активный ивент при навигации по сайту
    const router = useRouter()
    router.afterEach(() => { console.log('[promo] router.afterEach: reload active'); loadActive() })
    // Периодический опрос, чтобы не зависеть от кешей/долгой сессии
    setInterval(() => { loadActive() }, 60_000)

    // Вспомогательные функции
    const isImageUrl = (v?: string) => typeof v === 'string' && (v.startsWith('/uploads/') || v.startsWith('http'))
    const removeSprites = (immediate = false) => {
      const nodes = Array.from(document.querySelectorAll('[data-promo-sprite="1"]')) as HTMLElement[]
      if (immediate) {
        nodes.forEach(n => n.remove())
        return
      }
      // Плавное исчезновение перед удалением
      nodes.forEach((n) => {
        const el = n as HTMLElement
        el.style.opacity = '0'
        el.style.transform = 'scale(0.5)'
        setTimeout(() => el.remove(), 300)
      })
    }

    function notify(message: string, isSuccess = false) {
      // 1) Пытаемся через Nuxt UI
      try {
        const toast = (nuxtApp as any).$ui?.toast || (window as any).useToast?.()
        if (toast?.add) {
          toast.add({ title: isSuccess ? 'Готово' : 'Прогресс', description: message, color: isSuccess ? 'success' : 'primary' })
          return
        }
      } catch {}
      // 2) Фолбэк: простой DOM-тост
      try {
        const id = 'promo-toast-container'
        let container = document.getElementById(id) as HTMLDivElement | null
        if (!container) {
          container = document.createElement('div')
          container.id = id
          container.style.position = 'fixed'
          container.style.right = '12px'
          container.style.bottom = '12px'
          container.style.display = 'flex'
          container.style.flexDirection = 'column'
          container.style.gap = '8px'
          container.style.zIndex = '2147483647'
          document.body.appendChild(container)
        }
        const toastEl = document.createElement('div')
        toastEl.style.padding = '10px 12px'
        toastEl.style.borderRadius = '10px'
        toastEl.style.background = isSuccess ? 'rgba(16,185,129,0.95)' : 'rgba(59,130,246,0.95)'
        toastEl.style.color = '#fff'
        toastEl.style.fontSize = '14px'
        toastEl.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
        toastEl.style.opacity = '0'
        toastEl.style.transform = 'translateY(8px)'
        toastEl.style.transition = 'opacity 200ms ease, transform 200ms ease'
        toastEl.textContent = message
        container.appendChild(toastEl)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { toastEl.style.opacity = '1'; toastEl.style.transform = 'translateY(0)' })
        })
        setTimeout(() => {
          toastEl.style.opacity = '0'
          toastEl.style.transform = 'translateY(8px)'
          setTimeout(() => toastEl.remove(), 250)
        }, 2500)
      } catch {}
    }
    async function getProgress(ev: any): Promise<{ count: number, need: number }> {
      try {
        const prog: any = await $fetch(`/api/promo/progress?eventId=${ev._id}`, { method: 'GET', cache: 'no-cache' as any })
        const count = Number(prog?.progress?.count || 0)
        const need = Number(ev.requiredCount || 1)
        return { count, need }
      } catch { return { count: 0, need: Number(ev?.requiredCount || 1) } }
    }

    async function spawnSprite() {
      const ev = promoState.value
      if (!ev) { console.log('[promo] spawnSprite: no active event, skip'); return }
      if (userCompletedState.value) { console.log('[promo] spawnSprite: user already completed, skip'); return }
      // Проверим прогресс пользователя и остановим спаун, если всё собрано
      try {
        const { count, need } = await getProgress(ev)
        if (count >= need) {
          userCompletedState.value = true
          try { localStorage.setItem(`promo_completed_${ev._id}`, '1') } catch {}
          console.log('[promo] spawnSprite: already completed by user')
          return
        }
      } catch {}
      // Не более одного одновременно
      const existing = document.querySelectorAll('[data-promo-sprite="1"]').length
      if (existing >= 1) { console.log('[promo] spawnSprite: already on screen, skip'); return }

      const id = `promo-sprite-${ev._id}-${Date.now()}-${Math.floor(Math.random()*1000)}`
      const btn = document.createElement('button')
      btn.id = id
      btn.type = 'button'
      btn.setAttribute('data-promo-sprite', '1')
      btn.setAttribute('aria-label', 'promo-sprite')
      btn.className = 'fixed transition-all duration-300 hover:scale-110'
      const size = 42
      const px = Math.floor(20 + Math.random() * Math.max(20, (window.innerWidth - size - 40)))
      const py = Math.floor(80 + Math.random() * Math.max(20, (window.innerHeight - size - 160)))
      btn.style.position = 'fixed'
      btn.style.left = px + 'px'
      btn.style.top = py + 'px'
      btn.style.width = size + 'px'
      btn.style.height = size + 'px'
      btn.style.background = 'transparent'
      btn.style.cursor = 'pointer'
      btn.style.opacity = '0'
      btn.style.transform = 'scale(0.8)'
      // максимальный z-index
      btn.style.zIndex = '2147483647'

      const isImg = isImageUrl(ev.spriteIcon)
      console.log('[promo] spawnSprite: creating', { id, isImg, icon: ev.spriteIcon })
      if (isImg) {
        const img = document.createElement('img')
        img.src = String(ev.spriteIcon)
        img.alt = 'sprite'
        img.style.width = size + 'px'
        img.style.height = size + 'px'
        img.style.objectFit = 'contain'
        btn.appendChild(img)
      } else {
        const span = document.createElement('span')
        span.className = `iconify ${ev.spriteIcon || 'i-lucide-ghost'}`
        span.style.width = size + 'px'
        span.style.height = size + 'px'
        btn.appendChild(span)
      }

      btn.addEventListener('click', async () => {
        try {
          await $fetch('/api/promo/increment', { method: 'POST', body: { eventId: ev._id } })
          // Плавное исчезновение
          btn.style.opacity = '0'
          btn.style.transform = 'scale(0.5)'
          setTimeout(() => btn.remove(), 300)
          console.log('[promo] sprite clicked: increment sent')
          // Получим текущий прогресс пользователя и покажем уведомление
          try {
            const { count, need } = await getProgress(ev)
            if (count >= need) {
              notify(`Все собрано: ${count} из ${need}! Можно участвовать в розыгрыше.`, true)
              userCompletedState.value = true
              try { localStorage.setItem(`promo_completed_${ev._id}`, '1') } catch {}
              // Удалим оставшиеся спрайты
              removeSprites()
            } else {
              notify(`Собрано: ${count} из ${need}`)
            }
          } catch {}
        } catch (err) { console.warn('[promo] increment failed', err) }
      })

      document.body.appendChild(btn)
      console.log('[promo] sprite appended to DOM')
      // Плавное появление после добавления в DOM
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          btn.style.opacity = '1'
          btn.style.transform = 'scale(1)'
        })
      })
    }

    // Гарантированно один спрайт при загрузке и при переходах
    const isAdminRoute = () => {
      try {
        const r = router.currentRoute.value
        return String(r.path || '').startsWith('/admin')
      } catch { return false }
    }

    const ensureOneSprite = () => {
      const r = router.currentRoute.value
      console.log('[promo] ensureOneSprite: route', r?.path)
      if (isAdminRoute()) {
        console.log('[promo] ensureOneSprite: admin route, remove if exists')
        // на админ-страницах не показываем спрайты; удалим, если остались
        removeSprites(true)
        return
      }
      if (!promoState.value) {
        console.log('[promo] ensureOneSprite: no promoState, skip')
        return
      }
      // Проверяем шанс спауна
      const chance = Number(promoState.value.spawnChance ?? 100)
      const roll = Math.random() * 100
      if (roll > chance) {
        console.log('[promo] ensureOneSprite: spawn chance failed', { roll, chance })
        return
      }
      // если по каким-то причинам их больше одного — оставим первый, остальные плавно удалим
      const nodes = Array.from(document.querySelectorAll('[data-promo-sprite="1"]')) as HTMLElement[]
      if (nodes.length > 1) {
        console.log('[promo] ensureOneSprite: too many, trimming', nodes.length)
        nodes.slice(1).forEach((n) => {
          const el = n as HTMLElement
          el.style.opacity = '0'
          el.style.transform = 'scale(0.5)'
          setTimeout(() => el.remove(), 300)
        })
      }
      if (nodes.length === 0) { console.log('[promo] ensureOneSprite: spawn one'); spawnSprite() } else { console.log('[promo] ensureOneSprite: already present') }
    }

    // После монтирования приложения загружаем и показываем спрайт
    nuxtApp.hook('app:mounted', async () => {
      console.log('[promo] app:mounted: load active and ensure sprite')
      const ev = await loadActive()
      ensureOneSprite()
      // Повторные попытки если активный ивент ещё не готов
      if (!ev) {
        const retry = async () => {
          const e = await loadActive()
          ensureOneSprite()
          if (!e) setTimeout(retry, 5000)
        }
        setTimeout(retry, 2000)
      }
    })
    
    // При старте (на случай если DOM уже готов)
    console.log('[promo] init ensureOneSprite')
    if (typeof document !== 'undefined' && document.body) {
      ensureOneSprite()
    }
    // При каждом переходе по маршруту — снова гарантируем один спрайт
    router.beforeEach(() => {
      // Удаляем спрайт немедленно при навигации для чистого состояния
      removeSprites()
    })
    router.afterEach(() => {
      // небольшая задержка, чтобы не конфликтовать с переходной анимацией
      setTimeout(() => { console.log('[promo] afterEach ensureOneSprite'); ensureOneSprite() }, 50)
    })
  } catch {}
})


