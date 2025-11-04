<template>
  <div class="flex-1">
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">Учебная комната</h2>
      <p class="text-slate-600 dark:text-slate-300 mb-6">Полезные материалы, приказы и обучающие материалы для работы.</p>

      <div class="bg-white dark:bg-slate-800 rounded-lg">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700">
          <p class="text-sm text-slate-600 dark:text-slate-300">Разделы</p>
        </div>

        <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
          <li
            v-for="(section, index) in sections"
            :key="section.url"
            class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
            :class="{
              'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0) && !(sections.length % 2 === 1 && index === sections.length - 1),
              'md:border-b-0': sections.length % 2 === 0 && index >= sections.length - 2,
              'border-b-0': index === sections.length - 1,
              'md:col-span-2': sections.length % 2 === 1 && index === sections.length - 1
            }"
            @click="openSection(section)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-3">
                <UIcon :name="section.icon" class="w-6 h-6 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                <div>
                  <p class="text-slate-900 dark:text-white font-medium">{{ section.title }}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ section.description }}</p>
                </div>
              </div>
              <svg class="w-4 h-4 text-slate-400 flex-shrink-0 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </li>

          <li v-if="sections.length === 0" class="p-6 border-b-0">
            <p class="text-sm text-slate-600 dark:text-slate-300">Пока нет разделов</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Учебная комната' })

type ClassroomSection = {
  title: string
  description: string
  url: string
  icon: string
}

const sections: ClassroomSection[] = [
  {
    title: 'Инструкции',
    description: 'Инструкции и памятки для работы',
    url: '/classroom/instructions',
    icon: 'i-lucide-file-text'
  }
]

function openSection(section: ClassroomSection) {
  navigateTo(section.url)
}
</script>


