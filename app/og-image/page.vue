<script setup lang="ts">
const route = useRoute()

// Получаем название раздела из пути
const getSectionName = (path: string): string => {
  const p = path || '/'
  
  if (p === '/' || p === '') return 'Справочник СМП'
  
  // Разделы с вложенностью
  if (p.startsWith('/algorithms')) return 'Алгоритмы'
  if (p.startsWith('/calculators')) return 'Калькуляторы'
  if (p.startsWith('/classroom/instructions')) return 'Инструкции'
  if (p.startsWith('/apps')) return 'Приложения'
  if (p.startsWith('/favorites') || p.startsWith('/profile/bookmarks')) return 'Избранное'
  if (p.startsWith('/profile')) return 'Профиль'
  if (p.startsWith('/about')) return 'О проекте'
  if (p.startsWith('/contacts')) return 'Контакты'
  if (p.startsWith('/privacy')) return 'Конфиденциальность'
  if (p.startsWith('/updates')) return 'Обновления'
  if (p.startsWith('/help')) return 'Помощь'
  if (p.startsWith('/promo')) return 'Промо'
  if (p.startsWith('/substations')) return 'Подстанции'
  if (p.startsWith('/local-statuses')) return 'Локальные статусы'
  if (p.startsWith('/drugs')) return 'Лекарственные средства'
  if (p.startsWith('/codifier')) return 'Кодификатор'
  
  // По умолчанию
  return 'Справочник СМП'
}

const sectionName = getSectionName(route.path)
</script>

<template>
  <div style="display:flex;flex-direction:column;width:100%;height:100%;background-color:#f8fafc;font-family:Roboto, system-ui, -apple-system, Segoe UI, sans-serif;align-items:center;justify-content:center;padding:48px;">
    <!-- Логотип по центру -->
    <div style="display:flex;align-items:center;justify-content:center;margin-bottom:32px;">
      <img 
        src="/logo.svg" 
        alt="Логотип" 
        style="width:120px;height:120px;"
      />
    </div>
    
    <!-- Название раздела под логотипом -->
    <div style="font-size:42px;font-weight:600;color:#0f172a;text-align:center;line-height:1.2;">
      {{ sectionName }}
    </div>
  </div>
</template>

