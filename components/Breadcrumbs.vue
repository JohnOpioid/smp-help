<template>
  <div v-if="route.path !== '/' && route.path !== '/substations'" class="px-2 md:px-4 max-w-5xl mx-auto">
    <!-- Хлебные крошки -->
    <UBreadcrumb :items="items" />
    
    <!-- Кнопка "Назад" только на мобильных -->
    <div class="mt-4 md:hidden">
      <button @click="goBack"
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200 cursor-pointer">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Назад
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const route = useRoute()

// Функция для кнопки "Назад"
const goBack = () => history.length > 1 ? history.back() : navigateTo('/')

const customLastLabel = ref<string>('')
const customAlgoTrail = ref<{ sectionSlug: string; sectionName: string; categoryId?: string; categoryUrl?: string; categoryName: string; algoTitle?: string } | null>(null)

async function resolveLastLabel() {
  // Сбрасываем состояние сразу, чтобы не мигал хвост от предыдущей страницы
  customLastLabel.value = ''
  customAlgoTrail.value = null
  if (!route || !route.path) { 
    return 
  }
  const path = route.path
  const segs = path.split('/').filter(Boolean)
  const last = segs[segs.length - 1]
  if (!last) { customLastLabel.value = ''; return }
  if (path.startsWith('/codifier/')) {
    try {
      const res: any = await $fetch(`/api/codifier/${encodeURIComponent(last)}`)
      customLastLabel.value = res?.category?.name || ''
    } catch { customLastLabel.value = '' }
    return
  }
  if (path.startsWith('/local-statuses/')) {
    try {
      const res: any = await $fetch(`/api/local-statuses/${encodeURIComponent(last)}`)
      customLastLabel.value = res?.category?.name || ''
    } catch { customLastLabel.value = '' }
    return
  }
  if (path.startsWith('/algorithms/')) {
    try {
      const segs = path.split('/').filter(Boolean)
      const last = segs[segs.length - 1]
      // /algorithms/:section/:category → страница категории по URL; /algorithms/:section/:category/:id → страница алгоритма
      // /algorithms/:section — страница раздела
      if (segs.length === 2) {
        customLastLabel.value = segs[1] === 'adults' ? 'Взрослые' : segs[1] === 'pediatrics' ? 'Детские' : segs[1] === 'onmp-children' ? 'ОНМП Дети' : 'ОНМП'
        customAlgoTrail.value = null
        return
      }
      
      const sectionSlug = segs[1]
      const sectionName = sectionSlug === 'adults' ? 'Взрослые' : sectionSlug === 'pediatrics' ? 'Детские' : sectionSlug === 'onmp-children' ? 'ОНМП Дети' : 'ОНМП'
      const categorySegment = segs[2]
      const isCategoryObjectId = /^[a-f0-9]{24}$/i.test(categorySegment || '')
      
      // Если category - это ObjectId, загружаем категорию по ID
      if (segs.length >= 3 && isCategoryObjectId) {
        try {
          const category: any = await $fetch(`/api/algorithms/categories/${categorySegment}`)
          const algoId = segs[3]
          
          customAlgoTrail.value = {
            sectionSlug,
            sectionName,
            categoryUrl: category?.item?.url || categorySegment,
            categoryName: category?.item?.name || 'Категория'
          }
          
          // Если есть ID алгоритма, загружаем его
          if (algoId && /^[a-f0-9]{24}$/i.test(algoId)) {
            const algoRes: any = await $fetch(`/api/algorithms/${algoId}`)
            customLastLabel.value = algoRes?.item?.title || 'Алгоритм'
            if (algoRes?.item?.title) (customAlgoTrail.value as any).algoTitle = algoRes.item.title
          } else if (segs.length === 3) {
            customLastLabel.value = category?.item?.name || 'Категория'
          }
          return
        } catch {}
      }
      
      // Если category - это URL, работаем как раньше
      if (segs.length >= 3 && !isCategoryObjectId) {
        const categoryUrl = categorySegment
        try {
          const byUrl: any = await $fetch(`/api/algorithms/categories/by-url/${categoryUrl}`)
          const category = byUrl?.item
          if (segs.length === 3) customLastLabel.value = category?.name || categoryUrl
          customAlgoTrail.value = {
            sectionSlug,
            sectionName,
            categoryUrl,
            categoryName: category?.name || 'Категория'
          }
          // /algorithms/:section/:category/:id → страница алгоритма
          if (segs.length >= 4 && /^[a-f0-9]{24}$/i.test(segs[3] || '')) {
            const algoRes: any = await $fetch(`/api/algorithms/${segs[3]}`)
            customLastLabel.value = algoRes?.item?.title || customLastLabel.value
            if (algoRes?.item?.title) (customAlgoTrail.value as any).algoTitle = algoRes.item.title
          } else if (segs.length === 4 && /^[a-f0-9]{24}$/i.test(segs[3] || '')) {
            // /algorithms/:section/:category/:id → список алгоритмов категории по ID
            customLastLabel.value = category?.name || customLastLabel.value || categoryUrl
          }
          return
        } catch {}
      }
    } catch { /* ignore */ }
    customLastLabel.value = ''
    customAlgoTrail.value = null
    return
  }
  customLastLabel.value = ''
  customAlgoTrail.value = null
}

onMounted(() => resolveLastLabel())
watch([() => route?.path, () => route?.fullPath], () => resolveLastLabel())

const items = computed<BreadcrumbItem[]>(() => {
  if (!route || !route.path) {
    return [{ label: 'Главная', to: '/', icon: 'i-lucide-home' }]
  }
  const segments = route.path.split('/').filter(Boolean)
  const acc: BreadcrumbItem[] = [{ label: 'Главная', to: '/', icon: 'i-lucide-home' }]
  let path = ''
  const labelMap: Record<string, string> = {
    'algorithms': 'Алгоритмы',
    'adults': 'Взрослые',
    'pediatrics': 'Детские',
    'onmp': 'ОНМП',
    'onmp-children': 'ОНМП Дети',
    'codifier': 'Кодификатор',
    'local-statuses': 'Локальные статусы',
    'calculators': 'Калькуляторы',
    'drugs': 'Лекарства',
    'apps': 'Приложения',
    'instructions': 'Инструкции',
    'substations': 'Подстанции',
    'admin': 'Админка',
    'profile': 'Профиль',
    'bookmarks': 'Закладки',
    'settings': 'Настройки',
    'about': 'О проекте',
    'contacts': 'Контакты',
    'help': 'Помощь',
    'privacy': 'Политика конфиденциальности',
    // Маппинг английских названий категорий на русские
    'neurology': 'Неврология',
    'anesthesiology': 'Анестезиология и реаниматология',
    'cardiology': 'Кардиология',
    'dermatology': 'Дерматология',
    'endocrinology': 'Эндокринология',
    'gastroenterology': 'Гастроэнтерология',
    'hematology': 'Гематология',
    'infectious-diseases': 'Инфекционные болезни',
    'nephrology': 'Нефрология',
    'oncology': 'Онкология',
    'ophthalmology': 'Офтальмология',
    'orthopedics': 'Ортопедия',
    'otorhinolaryngology': 'Оториноларингология',
    'pediatrics-category': 'Педиатрия',
    'psychiatry': 'Психиатрия',
    'pulmonology': 'Пульмонология',
    'rheumatology': 'Ревматология',
    'surgery': 'Хирургия',
    'urology': 'Урология',
    'gynecology': 'Гинекология',
    'emergency-medicine': 'Скорая медицинская помощь'
  }

  // Явная ветка для /codifier
  if (segments[0] === 'codifier') {
    if (segments.length === 1) {
      acc.push({ label: 'Кодификатор' })
      return acc
    }
    // /codifier/:category...
    acc.push({ label: 'Кодификатор', to: '/codifier' })
    // Добавляем хвост (категория/диагноз)
    let localPath = '/codifier'
    segments.slice(1).forEach((seg, idx, rest) => {
      localPath += `/${seg}`
      const isLast = idx === rest.length - 1
      const base = isLast && customLastLabel.value
        ? customLastLabel.value
        : (labelMap[seg] || decodeURIComponent(seg).replace(/[-_]+/g, ' '))
      const label = base.charAt(0).toUpperCase() + base.slice(1)
      acc.push({ label, to: isLast ? undefined : localPath })
    })
    return acc
  }

  // Явная ветка для /local-statuses
  if (segments[0] === 'local-statuses') {
    if (segments.length === 1) {
      acc.push({ label: 'Локальные статусы' })
      return acc
    }
    // /local-statuses/:category...
    acc.push({ label: 'Локальные статусы', to: '/local-statuses' })
    let localPath = '/local-statuses'
    segments.slice(1).forEach((seg, idx, rest) => {
      localPath += `/${seg}`
      const isLast = idx === rest.length - 1
      const base = isLast && customLastLabel.value
        ? customLastLabel.value
        : (labelMap[seg] || decodeURIComponent(seg).replace(/[-_]+/g, ' '))
      const label = base.charAt(0).toUpperCase() + base.slice(1)
      acc.push({ label, to: isLast ? undefined : localPath })
    })
    return acc
  }

  // Явная ветка для /algorithms/:section (строго 2 сегмента)
  if (segments[0] === 'algorithms' && segments.length === 2) {
    const sectionSlug = segments[1]
    const sectionName = sectionSlug === 'adults' ? 'Взрослые' : sectionSlug === 'pediatrics' ? 'Детские' : sectionSlug === 'onmp-children' ? 'ОНМП Дети' : 'ОНМП'
    acc.push({ label: 'Алгоритмы', to: '/algorithms' })
    acc.push({ label: sectionName })
    return acc
  }

  // Специальная сборка для алгоритмов, чтобы показать: Алгоритмы > Раздел > Категория > Алгоритм
  // Используем customAlgoTrail ТОЛЬКО для путей глубже раздела (>= 3 сегментов)
  if (segments[0] === 'algorithms' && segments.length >= 3 && customAlgoTrail.value) {
    acc.push({ label: 'Алгоритмы', to: '/algorithms' })
    acc.push({ label: customAlgoTrail.value.sectionName || 'Раздел', to: `/algorithms/${customAlgoTrail.value.sectionSlug}` })
    const categoryPath = customAlgoTrail.value.categoryUrl
      ? `/algorithms/${customAlgoTrail.value.sectionSlug}/${customAlgoTrail.value.categoryUrl}`
      : `/algorithms/${customAlgoTrail.value.sectionSlug}/${customAlgoTrail.value.categoryId}`
    acc.push({ label: customAlgoTrail.value.categoryName || 'Категория', to: categoryPath })
    if (customAlgoTrail.value.algoTitle) {
      acc.push({ label: customAlgoTrail.value.algoTitle })
    }
    return acc
  }

  segments.forEach((seg, idx) => {
    path += `/${seg}`
    // Читаемый лейбл: для первого уровня используем карту, для остальных — человекочитаемый slug
    const isLast = idx === segments.length - 1
    // Если мы на глубине раздела (segments.length === 2), то НЕ используем customLastLabel,
    // иначе он может подтянуться из предыдущей страницы
    const allowCustom = !(segments[0] === 'algorithms' && segments.length === 2)
    const base = isLast && allowCustom && customLastLabel.value
      ? customLastLabel.value
      : (labelMap[seg] || decodeURIComponent(seg).replace(/[-_]+/g, ' '))
    const label = base.charAt(0).toUpperCase() + base.slice(1)
    acc.push({ label, to: isLast ? undefined : path })
  })
  return acc
})
</script>


