<template>
  <div>
    <div class="relative overflow-hidden">
      <div class="max-w-5xl mx-auto px-4 py-2 min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div class="w-full text-center">
          <div v-if="event" class="flex items-center justify-center mb-4">
            <template v-if="event?.eventLogoUrl">
              <img :src="event?.eventLogoUrl" alt="event-logo" class="max-h-36 w-auto object-contain" />
            </template>
            <template v-else>
              <UIcon :name="event?.spriteIcon || 'i-lucide-sparkles'" :class="['w-12 h-12', colorClass]" />
            </template>
          </div>

          <div class="backdrop-blur rounded-lg p-4 max-w-xl mx-auto shadow mb-6"
            :style="{ backgroundColor: primarySoftBg }">
            <h1 class="text-3xl font-bold mb-2" :style="{ color: textPrimaryHex }">{{ event?.title || 'Событие не найдено' }}</h1>
            <div class="text-sm mb-6" :style="{ color: textSecondaryHex }">{{ event ? formatRange(event.startAt, event.endAt) : '' }}</div>
            <div v-if="event && event.description" class="prose text-center dark:prose-invert max-w-none mx-auto mb-8"
              :style="{ color: textSecondaryHex }" v-html="renderDescription(event.description)"></div>

          </div>

          <!-- Розыгрыш: закрыт до выполнения прогресса -->
          <div v-if="event" class="backdrop-blur rounded-lg px-8 py-6 max-w-xl mx-auto shadow mb-6"
            :style="{ backgroundColor: primarySoftBg }">
            <!-- Сообщение с призами -->
            <div v-if="prizes && prizes.length > 0 && (progress?.count || 0) < ((event?.requiredCount) || 0)"
              class="mb-6">
              <div class="text-lg font-semibold mb-1 text-center" :style="{ color: textPrimaryHex }">
                Найди все спрятанные предметы для участия в розыгрыше
              </div>
              <div class="text-base mb-4 text-center opacity-90" :style="{ color: textSecondaryHex }">
                Получи шанс выиграть один из призов:
              </div>
              <div class="flex flex-wrap justify-center items-center gap-4">
                <div v-for="(prize, idx) in prizes" :key="prize._id || idx" class="relative group">
                  <div v-if="prize.imageUrl" class="cursor-pointer">
                    <img :src="prize.imageUrl" alt="prize" class="h-16 w-16 object-contain rounded-lg transition-transform hover:scale-110" />
                  </div>
                  <div v-else class="cursor-pointer">
                    <div class="h-16 w-16 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                         :style="{ backgroundColor: hexToRgba(textSecondaryHex, 0.2) }">
                      <UIcon name="i-lucide-gift" class="w-8 h-8" :style="{ color: textSecondaryHex }" />
                    </div>
                  </div>
                  <!-- Tooltip при наведении -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                    <div class="rounded-lg p-3 backdrop-blur shadow-lg w-64"
                         :style="{ backgroundColor: hexToRgba(secondaryHex600, 0.95), border: `1px solid ${hexToRgba(secondaryHex600, 0.3)}` }">
                      <div class="font-medium text-sm text-white mb-1">
                        {{ prize.title || 'Приз' }}
                      </div>
                      <div v-if="prize.description" class="text-xs text-white/90">
                        {{ prize.description }}
                      </div>
                      <!-- Стрелка вниз -->
                      <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                        <div class="w-2 h-2 rotate-45"
                             :style="{ backgroundColor: hexToRgba(secondaryHex600, 0.95) }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="relative w-full h-2 rounded-full overflow-visible bg-white/40 dark:bg-slate-700/60">
              <div class="h-full rounded-full"
                :style="{ width: progressPercent + '%', backgroundColor: textSecondaryHex }"></div>
              <div class="absolute -translate-y-1/2 z-10"
                :style="{ top: 'calc(50% + 1rem)', left: (progressPercent === 0 ? '0%' : progressPercent + '%'), transform: 'translate(-50%, -50%)' }">
                <span class="inline-flex items-center justify-center rounded-full shadow"
                  :style="{ backgroundColor: textSecondaryHex, width: '2rem', height: '2rem' }">
                  <template v-if="spriteIsUrl">
                    <img :src="event.spriteIcon" alt="sprite" class="h-6 w-6 object-contain promo-wiggle" />
                  </template>
                  <template v-else>
                    <UIcon :name="event.spriteIcon || 'i-lucide-ghost'" class="w-4 h-4 promo-wiggle"
                      style="color: white" />
                  </template>
                </span>
              </div>
            </div>
            <div class="text-sm mt-1" :style="{ color: textSecondaryHex }">Собрано: {{ Number((progress?.count) || 0) }}
              из {{
                Number((event?.requiredCount) || 0) }}</div>
            
            <!-- Кнопка "Начать собирать" -->
            <div class="mt-6 flex justify-center">
              <NuxtLink 
                to="/"
                class="inline-flex items-center justify-center text-lg font-semibold px-8 py-4 rounded-md transition-all duration-300 hover:scale-105 cursor-pointer"
                :style="{ 
                  backgroundColor: primaryHex600, 
                  color: 'white', 
                  boxShadow: `0 20px 40px -5px ${primaryHex600}CC`
                }"
                @mouseenter="(e: any) => { 
                  const el = e.currentTarget
                  el.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }"
                @mouseleave="(e: any) => { 
                  const el = e.currentTarget
                  el.style.boxShadow = `0 20px 40px -5px ${primaryHex600}CC`
                }">
                <UIcon name="i-lucide-sparkles" class="w-5 h-5 mr-2" />
                Начать собирать
              </NuxtLink>
            </div>

            <!-- Победители (пока показываем без проверки даты для теста) -->
            <div v-if="winners && winners.length > 0" class="mt-3">
              <div class="rounded-lg p-4 text-white" :style="{ backgroundColor: secondaryHex600 }">
                <div class="text-lg font-bold mb-4 text-center">🎉 Победители розыгрыша 🎉</div>
                <div class="space-y-3">
                  <div v-for="(winner, idx) in winners" :key="winner._id || idx"
                    class="bg-white/10 rounded-lg p-3 flex items-center gap-3">
                    <div class="shrink-0">
                      <UAvatar v-if="winner.userId?.avatarUrl" :src="winner.userId.avatarUrl"
                        :alt="winner.userId?.firstName || winner.userId?.email || 'Победитель'" size="lg" />
                      <UAvatar v-else size="lg" :alt="winner.userId?.firstName || winner.userId?.email || 'Победитель'">
                        {{ ((winner.userId?.firstName?.[0] || winner.userId?.email?.[0] || 'П') || 'П').toUpperCase() }}
                      </UAvatar>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-base">
                        {{ winner.userId ? `${winner.userId.firstName || ''} ${winner.userId.lastName || ''}`.trim() ||
                          winner.userId.email : 'Победитель' }}
                      </div>
                      <div class="text-sm opacity-90 mt-1">
                        Приз: {{ winner.prizeId?.title || 'Без названия' }}
                      </div>
                    </div>
                    <div v-if="winner.prizeId?.imageUrl" class="shrink-0">
                      <img :src="winner.prizeId.imageUrl" alt="prize" class="h-12 w-12 object-contain rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="(progress?.count || 0) >= ((event?.requiredCount) || 0)" class="mt-3">
              <div class="rounded-lg p-4 text-white" :style="{ backgroundColor: secondaryHex600 }">
                <div v-if="!participating" class="text-sm font-medium">Готово!</div>
                <div v-if="!participating" class="text-sm opacity-90 mt-1">Вы собрали все иконки и можете участвовать в
                  розыгрыше.
                </div>
                <div v-else class="text-sm">
                  <div class="font-medium">До розыгрыша</div>
                  <div class="opacity-90 mt-1">
                    <template v-if="countdownActive && countdownText">
                      <span class="text-2xl font-bold">{{ countdownText }}</span>
                    </template>
                    <template v-else>
                      Дата розыгрыша: {{ drawAtHuman }}
                    </template>
                  </div>
                </div>
                <div class="mt-3">
                  <UButton color="neutral" variant="solid"
                    class="text-white border-0 px-4 py-2 text-base rounded-md transition-shadow duration-200"
                    :class="{ 'shadow-lg': hoverParticipate }" @mouseenter="hoverParticipate = true"
                    @mouseleave="hoverParticipate = false" :style="{ backgroundColor: primaryHex600 }"
                    :disabled="participating || loadingParticipate" @click="handleParticipate">
                    <template v-if="loadingParticipate">
                      <UIcon name="i-lucide-loader-2" class="animate-spin w-4 h-4 mr-2" />
                      Обработка...
                    </template>
                    <template v-else-if="participating">
                      <UIcon name="i-lucide-check" class="w-4 h-4 mr-2" />
                      Вы участвуете!
                    </template>
                    <template v-else>
                      Участвовать
                    </template>
                  </UButton>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="max-w-xl mx-auto text-sm text-slate-500">Событие не найдено. Проверьте ссылку или откройте
            активное
            событие на странице промо.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'promo' })
const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const { data, refresh } = await useAsyncData(
  () => `promoBySlug-${slug.value}`,
  async () => {
    if (!slug.value) return null
    try {
      const bySlug: any = await $fetch(`/api/promo/${slug.value}`)
      if (bySlug?.success && bySlug.item) return bySlug
    } catch { }
    try {
      const active: any = await $fetch('/api/promo/active')
      return active?.item ? { success: true, item: active.item } : null
    } catch { }
    return null
  },
  { watch: [slug] }
)
const event = computed<any>(() => (data.value as any)?.item || null)

const { data: progressRes, refresh: refreshProgress } = await useAsyncData(
  () => `promoProgress-${(event.value && event.value._id) || 'none'}`,
  async () => {
    if (!event.value?._id) return { success: true, progress: { count: 0 } }
    return await ($fetch as any)(`/api/promo/progress?eventId=${event.value._id}`)
  },
  { watch: [event] }
)
const progress = computed<any>(() => (progressRes.value as any)?.progress || { count: 0 })

// Загружаем победителей (пока без проверки даты - для теста)
const { data: winnersRes } = await useAsyncData(
  () => `promoWinners-${(event.value && event.value._id) || 'none'}`,
  async () => {
    if (!event.value?._id) return { success: true, winners: [] }
    try {
      return await ($fetch as any)(`/api/promo/winners?eventId=${event.value._id}`)
    } catch {
      return { success: true, winners: [] }
    }
  },
  { watch: [event] }
)
const winners = computed<any[]>(() => (winnersRes.value as any)?.winners || [])

// Загружаем призы для отображения
const { data: prizesRes } = await useAsyncData(
  () => `promoPrizes-${(event.value && event.value._id) || 'none'}`,
  async () => {
    if (!event.value?._id) return { success: true, prizes: [] }
    try {
      return await ($fetch as any)(`/api/promo/prizes-public?eventId=${event.value._id}`)
    } catch {
      return { success: true, prizes: [] }
    }
  },
  { watch: [event] }
)
const prizes = computed<any[]>(() => (prizesRes.value as any)?.prizes || [])

const progressPercent = computed(() => {
  const count = Number((progress.value?.count) || 0)
  const need = Number((event.value?.requiredCount) || 1)
  const pct = Math.round((count / Math.max(1, need)) * 100)
  return Math.min(100, Math.max(0, pct))
})

// Передаём заголовок в лэйаут
const promoTitleState = useState<string>('promo_title', () => '')
watchEffect(() => { promoTitleState.value = event.value?.title || '' })
// Передаём тему в лэйаут
const promoThemeState = useState<any>('promo_theme', () => null)
watchEffect(() => {
  if (event.value) {
    promoThemeState.value = {
      themeBgColor: event.value.themeBgColor,
      themeColor: event.value.themeColor,
      themeLogo: event.value.themeLogo,
      themePrimaryColor: event.value.themePrimaryColor,
      themeSecondaryColor: event.value.themeSecondaryColor,
      themeTextPrimaryColor: event.value.themeTextPrimaryColor,
      themeTextSecondaryColor: event.value.themeTextSecondaryColor,
      bgImageUrl: event.value.bgImageUrl
    }
  }
})

// Обновляем глобальный активный промо для шапки, если ивент активен по датам
function isActivePromo(ev: any): boolean {
  if (!ev) return false
  const now = new Date().getTime()
  const start = ev.startAt ? new Date(ev.startAt).getTime() : 0
  const end = ev.endAt ? new Date(ev.endAt).getTime() : 0
  return !!ev.published && (!!start ? now >= start : true) && (!!end ? now <= end : true)
}
const activePromoState = useState<any>('active_promo', () => null)
watchEffect(() => {
  if (event.value && isActivePromo(event.value)) {
    activePromoState.value = event.value
  }
})

// Helper: определить, является ли строка URL-изображения
const isImageUrl = (v?: string): boolean => {
  return typeof v === 'string' && (v.startsWith('/uploads/') || v.startsWith('http'))
}
const spriteIsUrl = computed(() => isImageUrl((event.value as any)?.spriteIcon))

// Цветовая тема с поддержкой оттенков и прозрачности (например, amber-50, slate-800/50)
type ShadeMap = Record<string, string>
const palette: Record<string, ShadeMap> = {
  slate: { '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1', '400': '#94a3b8', '500': '#64748b', '600': '#475569', '700': '#334155', '800': '#1f2937', '900': '#0f172a' },
  gray: { '50': '#f9fafb', '100': '#f3f4f6', '200': '#e5e7eb', '300': '#d1d5db', '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563', '700': '#374151', '800': '#1f2937', '900': '#111827' },
  zinc: { '50': '#fafafa', '100': '#f4f4f5', '200': '#e4e4e7', '300': '#d4d4d8', '400': '#a1a1aa', '500': '#71717a', '600': '#52525b', '700': '#3f3f46', '800': '#27272a', '900': '#18181b' },
  neutral: { '50': '#fafafa', '100': '#f5f5f5', '200': '#e5e5e5', '300': '#d4d4d4', '400': '#a3a3a3', '500': '#737373', '600': '#525252', '700': '#404040', '800': '#262626', '900': '#171717' },
  stone: { '50': '#fafaf9', '100': '#f5f5f4', '200': '#e7e5e4', '300': '#d6d3d1', '400': '#a8a29e', '500': '#78716c', '600': '#57534e', '700': '#44403c', '800': '#292524', '900': '#1c1917' },
  red: { '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5', '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c', '800': '#991b1b', '900': '#7f1d1d' },
  orange: { '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74', '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c', '800': '#9a3412', '900': '#7c2d12' },
  amber: { '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d', '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309', '800': '#92400e', '900': '#78350f' },
  yellow: { '50': '#fefce8', '100': '#fef9c3', '200': '#fef08a', '300': '#fde047', '400': '#facc15', '500': '#eab308', '600': '#ca8a04', '700': '#a16207', '800': '#854d0e', '900': '#713f12' },
  lime: { '50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d', '300': '#bef264', '400': '#a3e635', '500': '#84cc16', '600': '#65a30d', '700': '#4d7c0f', '800': '#3f6212', '900': '#365314' },
  green: { '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac', '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534', '900': '#14532d' },
  emerald: { '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b' },
  teal: { '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a' },
  cyan: { '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490', '800': '#155e75', '900': '#164e63' },
  sky: { '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc', '400': '#38bdf8', '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1', '800': '#075985', '900': '#0c4a6e' },
  blue: { '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a' },
  indigo: { '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81' },
  violet: { '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95' },
  purple: { '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff', '300': '#d8b4fe', '400': '#c084fc', '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce', '800': '#6b21a8', '900': '#581c87' },
  fuchsia: { '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe', '300': '#f0abfc', '400': '#e879f9', '500': '#d946ef', '600': '#c026d3', '700': '#a21caf', '800': '#86198f', '900': '#701a75' },
  pink: { '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8', '300': '#f9a8d4', '400': '#f472b6', '500': '#ec4899', '600': '#db2777', '700': '#be185d', '800': '#9d174d', '900': '#831843' },
  rose: { '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337' }
}

function parseTwColorToken(token?: string, fallback = 'orange-600'): { hex: string, rgba: string } {
  let t = (token || fallback).trim()
  let alpha = 1
  if (t.includes('/')) {
    const [base, a] = t.split('/')
    t = base
    const aNum = Number(a)
    alpha = isFinite(aNum) ? (aNum > 1 ? aNum / 100 : aNum) : 1
  }
  const [name, shadeRaw] = t.split('-')
  const shade = shadeRaw || '600'
  const baseHex = palette[name]?.[shade] || palette[name]?.['600'] || '#ea580c'
  const r = parseInt(baseHex.slice(1, 3), 16)
  const g = parseInt(baseHex.slice(3, 5), 16)
  const b = parseInt(baseHex.slice(5, 7), 16)
  const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`
  return { hex: baseHex, rgba }
}

const colorName = computed(() => String(event.value?.themeColor || 'orange-600'))
const primaryToken = computed(() => String(event.value?.themePrimaryColor || colorName.value))
const secondaryToken = computed(() => String(event.value?.themeSecondaryColor || 'purple-600'))
const textPrimaryToken = computed(() => String(event.value?.themeTextPrimaryColor || (primaryToken.value.includes('-') ? primaryToken.value.replace(/-(\d+)/, '-700') : primaryToken.value)))
const textSecondaryToken = computed(() => String(event.value?.themeTextSecondaryColor || 'slate-600'))

const colorClass = computed(() => `text-${colorName.value}`)
const bgStyle = computed(() => {
  const url = (event.value as any)?.bgImageUrl as string | undefined
  if (url) {
    return {
      backgroundImage: `url('${url}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    } as any
  }
  return {} as any
})

const primaryHex600 = computed(() => parseTwColorToken(primaryToken.value).hex)
const secondaryHex600 = computed(() => parseTwColorToken(secondaryToken.value).hex)
const textPrimaryHex = computed(() => parseTwColorToken(textPrimaryToken.value).hex)
const textSecondaryHex = computed(() => parseTwColorToken(textSecondaryToken.value).hex)

function hexToRgba(hex: string, alpha = 0.08): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.substring(0, 2), 16)
  const g = parseInt(m.substring(2, 4), 16)
  const b = parseInt(m.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
const panelAlpha = computed(() => {
  const v = Number((event.value as any)?.panelOpacity ?? 8)
  if (!isFinite(v)) return 0.08
  const clamped = Math.max(0, Math.min(100, v))
  return clamped / 100
})
const primarySoftBg = computed(() => hexToRgba(primaryHex600.value, panelAlpha.value))
const secondarySoftBg = computed(() => hexToRgba(secondaryHex600.value, panelAlpha.value))
const hoverParticipate = ref<boolean>(false)
const participating = ref<boolean>(false)
const loadingParticipate = ref<boolean>(false)
const countdownText = ref<string>('')
const countdownActive = ref<boolean>(false)
let countdownTimer: any = null

const drawAtDate = computed<Date | null>(() => {
  const d = (event.value as any)?.drawAt
  if (!d) return null
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? null : dt
})

const drawAtHuman = computed<string>(() => {
  const d = drawAtDate.value
  return d ? d.toLocaleString('ru-RU') : '—'
})

function formatDiff(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(sec / 86400)
  const hours = Math.floor((sec % 86400) / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const seconds = sec % 60
  const parts: string[] = []
  if (days > 0) parts.push(`${days}д`)
  if (hours > 0 || days > 0) parts.push(`${hours}ч`)
  parts.push(`${minutes}м`)
  parts.push(`${seconds}с`)
  return parts.join(' ')
}

function startCountdown() {
  stopCountdown()
  const target = drawAtDate.value
  if (!target) { countdownActive.value = false; countdownText.value = ''; return }
  countdownActive.value = true
  const tick = () => {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) {
      countdownText.value = 'Розыгрыш начался'
      stopCountdown()
      countdownActive.value = false
      return
    }
    countdownText.value = formatDiff(diff)
  }
  tick()
  countdownTimer = setInterval(tick, 1000)
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

// Проверяем участие пользователя (после объявления всех необходимых переменных)
const { data: participationRes } = await useAsyncData(
  () => `promoParticipation-${(event.value && event.value._id) || 'none'}`,
  async () => {
    if (!event.value?._id) return { success: true, isParticipating: false }
    try {
      return await ($fetch as any)(`/api/promo/check-participation?eventId=${event.value._id}`)
    } catch {
      return { success: true, isParticipating: false }
    }
  },
  { watch: [event] }
)
watchEffect(() => {
  if (participationRes.value && (participationRes.value as any)?.isParticipating) {
    participating.value = true
    startCountdown()
  }
})

async function handleParticipate() {
  if (!event.value?._id || participating.value || loadingParticipate.value) return
  try {
    loadingParticipate.value = true
    const res: any = await $fetch('/api/promo/participate', {
      method: 'POST',
      body: { eventId: event.value._id }
    })
    if (res?.success) {
      participating.value = true
      // Показываем уведомление
      const toast = useToast()
      toast.add({ title: 'Вы участвуете в розыгрыше!', color: 'success' })
      startCountdown()
    } else {
      const toast = useToast()
      toast.add({ title: res?.message || 'Ошибка участия', color: 'error' })
    }
  } catch (e: any) {
    const toast = useToast()
    toast.add({ title: e?.message || 'Ошибка участия', color: 'error' })
  } finally {
    loadingParticipate.value = false
  }
}

onUnmounted(() => { stopCountdown() })

import { marked } from 'marked'
marked.setOptions({ gfm: true, breaks: true })
let sanitizeHtml: (h: string) => string = (h) => h
if (process.client) {
  const mod: any = await import('dompurify')
  const createDOMPurify = mod.default
  const purifier = createDOMPurify(window)
  sanitizeHtml = (h: string) => purifier.sanitize(h)
  // слушаем обновление из админки
  window.addEventListener('storage', (e) => {
    try {
      if (e.key === 'promo_updated') {
        const payload = JSON.parse(String(e.newValue || '{}'))
        if (payload?.slug && payload.slug === slug.value) refresh()
      }
    } catch { }
  })
}
function renderDescription(text?: string) {
  if (!text) return ''
  const raw = text.replace(/\r\n?/g, '\n')
  const html = marked.parse(raw) as string
  return sanitizeHtml(html)
}
function formatRange(a?: any, b?: any) {
  try {
    if (!a || !b) return ''
    const da = new Date(a)
    const db = new Date(b)
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return ''
    return `${da.toLocaleDateString()} — ${db.toLocaleDateString()}`
  } catch { return '' }
}
</script>

<style scoped>
@keyframes promo-wiggle {

  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-1px) scale(1.02);
  }
}

.promo-wiggle {
  animation: promo-wiggle 2.2s ease-in-out infinite;
}
</style>
