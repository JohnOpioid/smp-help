<template>
  <div :class="['min-h-screen flex flex-col', bgClass]" :style="bgStyle">
    <header class="w-full bg-transparent">
      <div class="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="flex items-center gap-2 cursor-pointer">
          <template v-if="promoTheme?.themeLogo && isImageUrl(promoTheme.themeLogo)">
            <img :src="promoTheme.themeLogo" alt="logo" class="h-9 w-9" />
          </template>
          <template v-else-if="promoTheme?.themeLogo">
            <UIcon :name="promoTheme.themeLogo" class="w-6 h-6" />
          </template>
          <template v-else>
            <img src="/logo.svg" alt="logo" class="h-9 w-9" />
          </template>
          <span class="sr-only">Главная</span>
        </NuxtLink>
        <div class="text-base font-semibold truncate" :class="headerTextClass">{{ promoTitle }}</div>
        <div class="w-8" />
      </div>
    </header>
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const promoTitleState = useState<string>('promo_title', () => '')
const promoTitle = computed(() => promoTitleState.value || 'Промо')

// Получаем тему из страницы
const promoTheme = useState<any>('promo_theme', () => null)

function buildBgClass(v?: string, fallback = 'transparent') {
  if (!v || typeof v !== 'string') return `bg-${fallback}`
  return `bg-${v.includes('-') ? v : v + '-50'}`
}
const bgClass = computed(() => buildBgClass(promoTheme.value?.themeBgColor || 'transparent'))
const bgStyle = computed(() => {
  const url = promoTheme.value?.bgImageUrl as string | undefined
  if (url) {
    return {
      backgroundImage: `url('${url}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    } as any
  }
  return {} as any
})
const headerTextClass = computed(() => {
  const base = (promoTheme.value?.themeColor as string) || 'slate'
  const color = base.includes('-') ? base.split('-')[0] : base
  return `text-${color}-900 dark:text-white`
})

function isImageUrl(v: any): boolean {
  if (!v || typeof v !== 'string') return false
  return v.startsWith('/uploads/') || v.startsWith('http://') || v.startsWith('https://')
}
</script>


