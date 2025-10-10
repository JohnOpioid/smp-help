<template>
  <div v-if="route.path !== '/' && route.path !== '/substations'" class="px-4 max-w-5xl mx-auto">
    <UBreadcrumb :items="items" />
  </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const route = useRoute()
const customLastLabel = ref<string>('')
const customAlgoTrail = ref<{ sectionSlug: string; sectionName: string; categoryId?: string; categoryUrl?: string; categoryName: string; algoTitle?: string } | null>(null)

async function resolveLastLabel() {
  if (!route || !route.path) { 
    customLastLabel.value = ''
    customAlgoTrail.value = null
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
      // /algorithms/view/:id → подставим название алгоритма
      if (segs[1] === 'view' && /^[a-f0-9]{24}$/i.test(segs[2] || '')) {
        const res: any = await $fetch(`/api/algorithms/${segs[2]}`)
        const item = res?.item
        customLastLabel.value = item?.title || ''
        if (item?.category?._id) {
          const sectionName: string = item?.section || ''
          const sectionSlug = sectionName === 'Взрослые' ? 'adults' : sectionName === 'Детские' ? 'pediatrics' : sectionName === 'ОНМП Дети' ? 'onmp-children' : 'onmp'
          customAlgoTrail.value = {
            sectionSlug,
            sectionName: sectionName || 'Раздел',
            categoryId: String(item.category._id),
            categoryName: item.category.name || 'Категория',
            algoTitle: item.title || ''
          }
        }
        return
      }
      // /algorithms/:section/:category → страница категории по URL; /algorithms/:section/:category/:id → страница алгоритма
      if (segs.length >= 3 && !/^[a-f0-9]{24}$/i.test(segs[2] || '')) {
        const sectionSlug = segs[1]
        const sectionName = sectionSlug === 'adults' ? 'Взрослые' : sectionSlug === 'pediatrics' ? 'Детские' : sectionSlug === 'onmp-children' ? 'ОНМП Дети' : 'ОНМП'
        const categoryUrl = segs[2]
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
          if (segs.length >= 4 && /^[a-f0-9]{24}$/i.test(segs[3] || '')) {
            const algoRes: any = await $fetch(`/api/algorithms/${segs[3]}`)
            customLastLabel.value = algoRes?.item?.title || customLastLabel.value
            if (algoRes?.item?.title) (customAlgoTrail.value as any).algoTitle = algoRes.item.title
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

onMounted(resolveLastLabel)
watch(() => route?.path, () => resolveLastLabel())

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

  // Специальная сборка для алгоритмов, чтобы показать: Алгоритмы > Раздел > Категория > Алгоритм
  if (segments[0] === 'algorithms' && customAlgoTrail.value) {
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
    const base = isLast && customLastLabel.value
      ? customLastLabel.value
      : (labelMap[seg] || decodeURIComponent(seg).replace(/[-_]+/g, ' '))
    const label = base.charAt(0).toUpperCase() + base.slice(1)
    acc.push({ label, to: isLast ? undefined : path })
  })
  return acc
})
</script>


