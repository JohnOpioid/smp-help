<template>
  <div>
    <main class="flex-1">

      <!-- Основной контент -->
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
        <div v-if="error" class="text-center py-8">
          <p class="text-red-600 dark:text-red-400">Ошибка загрузки данных</p>
        </div>

        <div v-else class="bg-white dark:bg-slate-800 rounded-lg">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-600 dark:text-slate-300">Заболевания категории "{{ category?.name }}"</p>
          </div>

          <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
            <li v-for="(item, index) in filteredItems" :key="item._id"
              class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
              :class="{ 
                'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0 && index < filteredItems.length - 1) || (index === filteredItems.length - 1 && filteredItems.length % 2 === 1),
                'md:border-b-0': index >= filteredItems.length - 2 && filteredItems.length % 2 === 0,
                'border-b-0': index === filteredItems.length - 1
              }"
              @click="openModal(item)">
              <div class="flex items-center justify-between">
                <div class="min-w-0">
                  <p class="text-slate-900 dark:text-white font-medium truncate">{{ item.name }}</p>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 font-mono">{{ item.mkbCode }}</span>
                    <span class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-mono">{{ item.stationCode }}</span>
                  </div>
                  <p v-if="item.note" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{{ item.note }}</p>
                </div>
                <svg class="w-4 h-4 text-slate-400 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </li>

            <!-- Индикатор загрузки -->
            <li v-if="isLoading" class="col-span-1 md:col-span-2 p-6">
              <div class="flex items-center justify-center space-x-2">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span class="text-sm text-slate-600 dark:text-slate-300">Загрузка...</span>
              </div>
            </li>

            <!-- Триггер для ленивой загрузки -->
            <div ref="loadMoreTrigger" class="h-1 col-span-1 md:col-span-2"></div>

            <li v-if="!isLoading && filteredItems.length === 0 && otherCategoryGroups.length === 0" class="col-span-1 md:col-span-2 p-6">
              <div class="flex flex-col items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <span>В категории ничего не найдено</span>
              </div>
            </li>
          </ul>

          <!-- Если в категории не найдено, показать результаты из других категорий -->
          <div v-if="!isLoading && searchText.trim() && filteredItems.length === 0 && otherCategoryGroups.length > 0" class="pb-4">
            <div v-for="group in otherCategoryGroups" :key="group.categoryUrl">
              <div class="relative my-4">
                <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-600"></div></div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">В категории {{ group.categoryName }}</span>
                </div>
              </div>
              <ul class="divide-y divide-slate-100 dark:divide-slate-700">
                <li v-for="it in group.items" :key="it._id"
                    class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                    @click="openDiagnosis(it)">
                  <div class="flex items-center justify-between">
                    <div class="min-w-0">
                      <p class="text-slate-900 dark:text-white font-medium truncate">{{ it.name }}</p>
                      <div class="flex items-center gap-2 mt-1 flex-wrap">
                        <span class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 font-mono">{{ it.mkbCode }}</span>
                        <span v-if="it.stationCode" class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-mono">{{ it.stationCode }}</span>
                      </div>
                      <p v-if="it.note" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{{ it.note }}</p>
                    </div>
                    <svg class="w-4 h-4 text-slate-400 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

    <!-- Модалка с информацией о заболевании -->
    <template v-if="!isMobile">
      <UModal 
        v-model:open="modalOpen" 
        :title="selectedItem?.name || ''" 
        description="Информация о заболевании" 
        :ui="{ 
          overlay: 'bg-slate-700/50',
          wrapper: 'sm:max-w-lg',
          content: 'sm:rounded-md rounded-t-md max-h-[80vh] sm:max-h-[85vh]',
          body: 'p-4 sm:p-6 overflow-y-auto custom-scroll',
          close: 'cursor-pointer'
        }"
        modal
        overlay
        transition
      >
        <template #body>
          <div v-if="selectedItem" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код МКБ-10</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.mkbCode }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код станции</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.stationCode }}</p>
              </div>
            </div>
            
            <div>
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Нозологическая форма</label>
              <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ selectedItem.name }}</p>
            </div>

            <div v-if="selectedItem.note">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Примечание</label>
              <p class="text-slate-600 dark:text-slate-300">{{ selectedItem.note }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Категория</label>
              <p class="text-slate-600 dark:text-slate-300">{{ selectedItem.category?.name }}</p>
            </div>
          </div>
        </template>
        <template #footer>
            <div class="flex gap-3 w-full">
            <button 
              type="button" 
              :title="isBookmarked ? 'В избранном' : 'В закладки'" 
              :disabled="!selectedItem"
              @click="toggleBookmark()"
              class="rounded-md font-medium inline-flex disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-3 py-2 text-sm gap-2 text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 cursor-pointer flex-1 justify-center items-center"
            >
              <UIcon :name="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'" class="w-4 h-4" />
              {{ isBookmarked ? 'В избранном' : 'В закладки' }}
            </button>
            <div ref="shareRef" class="relative flex-1">
              <button 
                type="button" 
                title="Поделиться"
                @click="toggleShareMenu()"
                class="w-full rounded-md font-medium inline-flex disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-3 py-2 text-sm gap-2 text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 cursor-pointer justify-center items-center"
              >
                <UIcon name="i-heroicons-share" class="w-4 h-4" />
                Поделиться
              </button>
              <div v-if="shareMenuOpen" class="absolute right-0 bottom-full mb-2 z-50 w-72 sm:w-80 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-3">
                <div class="rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div v-if="!shareOgUrl" class="w-full aspect-[3/2] bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  <template v-else>
                    <div v-show="!shareImageLoaded" class="w-full aspect-[3/2] bg-slate-100 dark:bg-slate-700 animate-pulse" />
                    <img :src="shareOgUrl" alt="preview" class="w-full h-auto" v-show="shareImageLoaded" @load="shareImageLoaded = true" @error="shareImageLoaded = false" />
                  </template>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" :disabled="!selectedItem" @click.stop="shareViaTelegram" class="rounded-md px-3 py-2 text-xs flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300 cursor-pointer">
                    <UIcon name="i-simple-icons-telegram" class="w-4 h-4" /> Telegram
                  </button>
                  <button type="button" :disabled="!selectedItem" @click.stop="shareViaWhatsApp" class="rounded-md px-3 py-2 text-xs flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 cursor-pointer">
                    <UIcon name="i-simple-icons-whatsapp" class="w-4 h-4" /> WhatsApp
                  </button>
                </div>
                <div class="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" :disabled="!canShareNow" @pointerdown.stop.prevent @mousedown.stop.prevent @click.stop="shareImage" class="rounded-md px-3 py-2 text-sm flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600">
                    <UIcon name="i-heroicons-share" class="w-4 h-4" />Поделиться
                  </button>
                  <button type="button" :disabled="!selectedItem" @pointerdown.stop.prevent @mousedown.stop.prevent @click.stop.prevent="downloadImage" class="rounded-md px-3 py-2 text-sm flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600">
                    <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />Сохранить
                  </button>
                </div>
                <div class="mt-2 relative">
                  <input
                    v-if="directShareUrl"
                    :value="directShareUrl"
                    readonly
                    @pointerdown.stop.prevent
                    @mousedown.stop.prevent
                    @click.stop.prevent="copyShareLink"
                    class="w-full text-xs pl-3 pr-9 py-2 rounded-md border-0 focus:outline-none focus:ring-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer select-none caret-transparent"
                  />
                  <span
                    v-if="directShareUrl"
                    class="absolute inset-y-0 right-2 inline-flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 cursor-pointer"
                    @pointerdown.stop.prevent
                    @mousedown.stop.prevent
                    @click.stop.prevent="copyShareLink"
                    title="Копировать ссылку"
                  >
                    <UIcon name="i-heroicons-clipboard" class="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
            </div>
        </template>
      </UModal>
    </template>

    <!-- Bottom Sheet для мобильных -->
    <template v-else>
      <ClientOnly>
        <BottomSheet 
          v-model="modalOpen"
          :title="selectedItem?.name"
          @close="modalOpen = false"
        >
          <div class="p-4 pb-6">
            <div v-if="selectedItem" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код МКБ-10</label>
                  <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.mkbCode }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код станции</label>
                  <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.stationCode }}</p>
                </div>
              </div>
              
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Нозологическая форма</label>
                <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ selectedItem.name }}</p>
              </div>

              <div v-if="selectedItem.note">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Примечание</label>
                <p class="text-slate-600 dark:text-slate-300">{{ selectedItem.note }}</p>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Категория</label>
                <p class="text-slate-600 dark:text-slate-300">{{ selectedItem.category?.name }}</p>
              </div>
            </div>
            
            <!-- Кнопки действий -->
            <div class="mt-6">
              <div class="flex gap-3 w-full">
                <button 
                  type="button" 
                  :title="isBookmarked ? 'В избранном' : 'В закладки'" 
                  :disabled="!selectedItem"
                  @click="toggleBookmark()"
                  class="rounded-md font-medium inline-flex disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-3 py-2 text-sm gap-2 text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 cursor-pointer flex-1 justify-center items-center"
                >
                  <UIcon :name="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'" class="w-4 h-4" />
                  {{ isBookmarked ? 'В избранном' : 'В закладки' }}
                </button>
                <div ref="shareRef" class="relative flex-1">
                  <button 
                    type="button" 
                    title="Поделиться"
                    @click="toggleShareMenu()"
                    class="w-full rounded-md font-medium inline-flex disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-3 py-2 text-sm gap-2 text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 cursor-pointer justify-center items-center"
                  >
                    <UIcon name="i-heroicons-share" class="w-4 h-4" />
                    Поделиться
                  </button>
              <div v-if="shareMenuOpen" class="absolute right-0 bottom-full mb-2 z-50 w-72 sm:w-80 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-3">
                    <div class="rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div v-if="!shareOgUrl" class="w-full aspect-[3/2] bg-slate-100 dark:bg-slate-700 animate-pulse" />
                      <template v-else>
                        <div v-show="!shareImageLoaded" class="w-full aspect-[3/2] bg-slate-100 dark:bg-slate-700 animate-pulse" />
                        <img :src="shareOgUrl" alt="preview" class="w-full h-auto" v-show="shareImageLoaded" @load="shareImageLoaded = true" @error="shareImageLoaded = false" />
                      </template>
                    </div>
                
                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" :disabled="!selectedItem" @click.stop="shareViaTelegram" class="rounded-md px-3 py-2 text-xs flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300 cursor-pointer">
                        <UIcon name="i-simple-icons-telegram" class="w-4 h-4" /> Telegram
                      </button>
                      <button type="button" :disabled="!selectedItem" @click.stop="shareViaWhatsApp" class="rounded-md px-3 py-2 text-xs flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 cursor-pointer">
                        <UIcon name="i-simple-icons-whatsapp" class="w-4 h-4" /> WhatsApp
                      </button>
                    </div>
                    <div class="mt-2 grid grid-cols-2 gap-2">
                      <button type="button" :disabled="!canShareNow" @pointerdown.stop.prevent @mousedown.stop.prevent @click.stop="shareImage" class="rounded-md px-3 py-2 text-sm flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600">
                        <UIcon name="i-heroicons-share" class="w-4 h-4" />Поделиться
                      </button>
                      <button type="button" :disabled="!selectedItem" @pointerdown.stop.prevent @mousedown.stop.prevent @click.stop.prevent="downloadImage" class="rounded-md px-3 py-2 text-sm flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600">
                        <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />Сохранить
                      </button>
                    </div>
                    <div class="mt-2 relative">
                      <input
                        v-if="directShareUrl"
                        :value="directShareUrl"
                        readonly
                        @pointerdown.stop.prevent
                        @mousedown.stop.prevent
                        @click.stop.prevent="copyShareLink"
                        class="w-full text-xs pl-3 pr-9 py-2 rounded-md border-0 focus:outline-none focus:ring-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer select-none caret-transparent"
                      />
                      <span
                        v-if="directShareUrl"
                        class="absolute inset-y-0 right-2 inline-flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 cursor-pointer"
                        @pointerdown.stop.prevent
                        @mousedown.stop.prevent
                        @click.stop.prevent="copyShareLink"
                        title="Копировать ссылку"
                      >
                        <UIcon name="i-heroicons-clipboard" class="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BottomSheet>
      </ClientOnly>
    </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'

definePageMeta({ headerTitle: 'Кодификатор' })

const route = useRoute()
const url = route.params.url as string

// Загружаем элемент на сервере для установки мета-тегов
const itemId = route.query.id as string | undefined
let serverItem: any = null

// Получаем абсолютный URL для изображения
const getBaseUrl = () => {
  if (process.server) {
    const headers = useRequestHeaders()
    const host = headers.host || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    return `${protocol}://${host}`
  }
  if (process.client) {
    return `${window.location.protocol}//${window.location.host}`
  }
  return process.env.NODE_ENV === 'production' ? 'https://smp-help.ru' : 'http://localhost:3000'
}

// Ставим базовые OG-теги сразу (даже если БД недоступна)
if (process.server) {
  const baseUrl = getBaseUrl()
  const itemIdForOg = itemId
  const v = itemIdForOg || String(Date.now())
  // Используем API-эндпоинт генерации PNG, который отдает корректный Content-Type
  const image = itemIdForOg
    ? `${baseUrl}/api/codifier/og-image/${itemIdForOg}?v=${v}`
    : `${baseUrl}/api/codifier/og-image/${v}`
  useServerHead({
    meta: [
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: baseUrl + route.fullPath },
      { property: 'og:site_name', content: 'Справочник СМП' },
      { property: 'og:image', content: image },
      { property: 'og:image:secure_url', content: image },
      { property: 'og:image:type', content: 'image/png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: image }
    ],
    link: [ { rel: 'image_src', href: image } ]
  })
}

if (itemId && process.server) {
  try {
    const { default: connectDB } = await import('~/server/utils/mongodb')
    const MKB = (await import('~/server/models/MKB')).default
    await connectDB()
    serverItem = await MKB.findById(itemId)
      .populate('category', 'name url')
      .lean()
    
    // Устанавливаем мета-теги на сервере
    if (serverItem) {
      const baseUrl = getBaseUrl()
      const ogImageUrl = `${baseUrl}/api/codifier/og-image/${itemId}?v=${itemId}`

      useServerHead({
        title: `${serverItem.name} — Кодификатор`,
        meta: [
          { property: 'og:locale', content: 'ru_RU' },
          { name: 'description', content: serverItem.note || `МКБ-10: ${serverItem.mkbCode}${serverItem.stationCode ? ` | Код станции: ${serverItem.stationCode}` : ''}` },
          { property: 'og:title', content: `${serverItem.name} — Кодификатор` },
          { property: 'og:description', content: serverItem.note || `МКБ-10: ${serverItem.mkbCode}${serverItem.stationCode ? ` | Код станции: ${serverItem.stationCode}` : ''}` },
          { property: 'og:image', content: ogImageUrl },
          { property: 'og:image:secure_url', content: ogImageUrl },
          { property: 'og:image:type', content: 'image/png' },
          { property: 'og:image:alt', content: serverItem.name || 'Кодификатор' },
          { property: 'og:image:width', content: '900' },
          { property: 'og:image:height', content: '600' },
          { property: 'og:site_name', content: 'Справочник СМП' },
          { property: 'og:type', content: 'website' },
          { property: 'og:url', content: baseUrl + route.fullPath },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: `${serverItem.name} — Кодификатор` },
          { name: 'twitter:description', content: serverItem.note || `МКБ-10: ${serverItem.mkbCode}${serverItem.stationCode ? ` | Код станции: ${serverItem.stationCode}` : ''}` },
          { name: 'twitter:image', content: ogImageUrl }
        ],
        link: [
          { rel: 'image_src', href: ogImageUrl },
          { rel: 'canonical', href: baseUrl + route.fullPath }
        ]
      })
    }
  } catch (e) {
    console.error('Ошибка загрузки элемента на сервере:', e)
  }
}

// Состояние для ленивой загрузки
const allItems = ref<any[]>([])
const currentPage = ref(1)
const isLoading = ref(false)
const hasMore = ref(true)
const error = ref<string | null>(null)
const category = ref<any>(null)

// Загрузка данных
async function loadItems(page: number = 1, append: boolean = false) {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    const response = await $fetch<{ 
      success: boolean; 
      category: any; 
      items: any[];
      pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      }
    }>(`/api/codifier/${url}`, {
      query: { page, limit: 10 }
    })
    
    if (response.success) {
      if (page === 1) {
        category.value = response.category
        allItems.value = response.items
      } else {
        allItems.value.push(...response.items)
      }
      
      hasMore.value = response.pagination.hasNextPage
      currentPage.value = page
      
    } else {
      error.value = 'Ошибка загрузки данных'
    }
  } catch (err) {
    error.value = 'Ошибка загрузки данных'
    console.error('Ошибка загрузки:', err)
  } finally {
    isLoading.value = false
  }
}

// Загрузка конкретного элемента по ID
async function loadSpecificItem(itemId: string) {
  try {
    
    // Загружаем элемент напрямую из API MKB
    const response = await $fetch<{ success: boolean; items: any[] }>('/api/mkb/all')
    
    if (response.success && response.items) {
      const found = response.items.find((item: any) => String(item._id) === String(itemId))
      
      if (found) {
        
        // Проверяем, что элемент принадлежит текущей категории
        if (found.category?.url === url) {
          // Добавляем элемент в список, если его там еще нет
          const exists = allItems.value.find((item: any) => String(item._id) === String(itemId))
          if (!exists) {
            allItems.value.push(found)
          }
          
          // Открываем модалку
          selectedItem.value = found
          modalOpen.value = true
          updateIsBookmarked()
        } else {
        }
      } else {
      }
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки конкретного элемента:', err)
  }
}

// Intersection Observer для ленивой загрузки
const loadMoreTrigger = ref<HTMLElement>()
let io: IntersectionObserver | null = null

onMounted(async () => {
  // Загружаем первую страницу
  await loadItems(1)
  
  // Настраиваем Intersection Observer после следующего тика
  await nextTick()
  
  // IntersectionObserver для догрузки
  io = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry && entry.isIntersecting) {
      if (hasMore.value && !isLoading.value) {
        console.log('📥 Загружаем следующую страницу:', currentPage.value + 1)
        loadItems(currentPage.value + 1, true)
      } else {
      }
    }
  })
  if (loadMoreTrigger.value && io) {
    io.observe(loadMoreTrigger.value)
  } else {
  }

  // Авто-открытие по query параметрам
  const itemId = routeQuery.query.id as string | undefined
  const openId = routeQuery.query.open as string | undefined
  const mkbCode = routeQuery.query.mkb as string | undefined
  
  
  // Обрабатываем только openId и mkbCode здесь, itemId обрабатывается в watcher
  if (openId) {
    const found = items.value.find((i: any) => String(i._id) === String(openId))
    if (found) openModal(found)
  } else if (mkbCode) {
    const found = items.value.find((i: any) => i.mkbCode === mkbCode)
    if (found) openModal(found)
  } else if (itemId) {
    // Если есть itemId при загрузке страницы и мы на сервере загрузили элемент, используем его
    if (serverItem) {
      selectedItem.value = serverItem
      modalOpen.value = true
      updateIsBookmarked()
    } else {
      // Если на клиенте, загружаем элемент
      const checkAndOpenItem = () => {
        if (items.value.length > 0) {
          const found = items.value.find((i: any) => String(i._id) === String(itemId))
          if (found) {
            selectedItem.value = found
            modalOpen.value = true
            updateIsBookmarked()
          } else {
            loadSpecificItem(itemId)
          }
        } else {
          console.log('⏳ Данные еще загружаются при загрузке, повторяем через 100мс')
          setTimeout(checkAndOpenItem, 100)
        }
      }
      checkAndOpenItem()
    }
  }
})

onUnmounted(() => {
  try { 
    io?.disconnect() 
  } catch { }
})

// Computed для отображения элементов
const items = computed(() => allItems.value)
const searchText = ref('')
const filteredItems = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return items.value
  return (items.value as any[]).filter((it) => {
    const text = [it.name, it.mkbCode, it.stationCode, it.note].filter(Boolean).join(' ').toLowerCase()
    return text.includes(q)
  })
})

function clearSearch() { searchText.value = '' }

// Поиск по всем категориям при пустой выдаче в текущей
const allDiagnoses = ref<any[]>([])
onMounted(async () => {
  try {
    const res: any = await $fetch('/api/mkb/all')
    allDiagnoses.value = res?.items || []
  } catch {}
})

const otherCategoryGroups = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return []
  const currentUrl = route.params.url as string
  const matched = (allDiagnoses.value as any[]).filter((it) => {
    const text = [it.name, it.mkbCode, it.stationCode, it.note].filter(Boolean).join(' ').toLowerCase()
    const catUrl = String(it.category?.url || '')
    return text.includes(q) && catUrl && catUrl !== currentUrl
  }).slice(0, 200)
  const groups: Record<string, any[]> = {}
  for (const it of matched) {
    const cu = String(it.category?.url)
    ;(groups[cu] ||= []).push(it)
  }
  return Object.keys(groups).map((cu) => ({
    categoryUrl: cu,
    categoryName: String((groups[cu][0]?.category?.name) || 'Категория'),
    items: groups[cu]
  }))
})

function openDiagnosis(it: any) {
  const url = String(it.category?.url || '')
  if (url) navigateTo(`/codifier/${url}?open=${it._id}`)
}

const { isMobile } = useIsMobile()
const modalOpen = ref(false)
const selectedItem = ref<any>(null)
const isBookmarked = ref(false)
const userBookmarks = ref<any[]>([])
const shareMenuOpen = ref(false)
const shareRef = ref<HTMLElement | null>(null)
const shareImageLoaded = ref(false)
const shareFile = ref<File | null>(null)
// Кнопку «Поделиться» разрешаем при наличии элемента; файл подгрузим в обработчике при необходимости
const canShareNow = computed(() => !!selectedItem.value)

// Прямая ссылка для копирования
const directShareUrl = computed(() => {
  const id = (route.query.id as string) || (selectedItem.value?._id as string)
  if (!id) return ''
  const base = getBaseUrl()
  return `${base}${route.path}?id=${id}`
})

function onGlobalClick(e: MouseEvent) {
  const root = shareRef.value
  if (!root) return
  const target = e.target as Node
  if (shareMenuOpen.value && target && !root.contains(target)) {
    shareMenuOpen.value = false
  }
}

onMounted(() => {
  if (process.client) {
    document.addEventListener('click', onGlobalClick)
  }
})

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('click', onGlobalClick)
  }
})

function toggleShareMenu() {
  shareMenuOpen.value = !shareMenuOpen.value
  if (shareMenuOpen.value) {
    shareImageLoaded.value = false
    shareFile.value = null
    // Предзагрузка файла для сохранения «жеста» на шаринг
    getOgImageFile().then((f) => {
      if (f) {
        shareFile.value = f
      }
    }).catch(() => {})
  }
}

async function copyShareLink(e?: Event) {
  try {
    const value = directShareUrl.value
    if (!value) return
    await navigator.clipboard.writeText(value)
    try { document.getSelection()?.removeAllRanges() } catch {}
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Ссылка скопирована', color: 'primary' })
  } catch (_) {
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось скопировать', color: 'error' })
  }
}

// Мета-теги для OG изображения
const ogImageUrl = computed(() => {
  const itemId = route.query.id as string | undefined
  if (!itemId) return undefined
  const baseUrl = getBaseUrl()
  // Клиентская версия с версионированием, чтобы платформа не брала старый кеш
  return `${baseUrl}/api/codifier/og-image/${itemId}?v=${itemId}`
})

// URL для превью в поповере: используем id из query либо из выбранного элемента
const shareOgUrl = computed(() => {
  const baseUrl = getBaseUrl()
  const qid = route.query.id as string | undefined
  const sid = selectedItem.value?._id as string | undefined
  const id = qid || sid
  return id ? `${baseUrl}/api/codifier/og-image/${id}?v=${id}&w=900&h=600` : undefined
})

// Обновляем мета-теги на клиенте при изменении selectedItem или route.query.id
if (process.client) {
  watch([selectedItem, () => route.query.id, ogImageUrl], ([item, itemId, imageUrl]) => {
    if (!item || !itemId || !imageUrl) {
      return
    }
    
    // Используем useSeoMeta для правильной установки мета-тегов
    useSeoMeta({
      title: `${item.name} — Кодификатор`,
      description: item.note || `МКБ-10: ${item.mkbCode}${item.stationCode ? ` | Код станции: ${item.stationCode}` : ''}`,
      ogTitle: `${item.name} — Кодификатор`,
      ogDescription: item.note || `МКБ-10: ${item.mkbCode}${item.stationCode ? ` | Код станции: ${item.stationCode}` : ''}`,
      ogImage: imageUrl,
      ogImageAlt: item.name || 'Кодификатор',
      ogImageWidth: '1200',
      ogImageHeight: '630',
      ogType: 'website',
      ogUrl: window.location.href,
      twitterCard: 'summary_large_image',
      twitterTitle: `${item.name} — Кодификатор`,
      twitterDescription: item.note || `МКБ-10: ${item.mkbCode}${item.stationCode ? ` | Код станции: ${item.stationCode}` : ''}`,
      twitterImage: imageUrl,
    })
  }, { immediate: true })
}



// Функция для обработки открытия BottomSheet

function openModal(item: any) {
  selectedItem.value = item
  modalOpen.value = true
  
  // Обновляем URL с ID диагноза через query параметр только если его еще нет
  if (!route.query.id || route.query.id !== item._id) {
    // Используем прямое изменение истории браузера для избежания моргания
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('id', item._id)
    window.history.replaceState({}, '', newUrl.toString())
  }
  
  // обновляем статус избранного
  updateIsBookmarked()
}

function closeModal() {
  modalOpen.value = false
  // Очищаем query параметры используя прямое изменение истории браузера
  const newUrl = new URL(window.location.href)
  newUrl.searchParams.delete('id')
  newUrl.searchParams.delete('open')
  newUrl.searchParams.delete('mkb')
  window.history.replaceState({}, '', newUrl.toString())
}

async function loadBookmarks() {
  try {
    const res: any = await $fetch('/api/bookmarks')
    if (res?.success) userBookmarks.value = res.items || []
  } catch {}
}

function buildItemUrl(it: any) {
  return `/codifier/${url}?id=${it?._id}`
}

async function updateIsBookmarked() {
  if (!selectedItem.value) { isBookmarked.value = false; return }
  if (userBookmarks.value.length === 0) await loadBookmarks()
  const targetUrl = buildItemUrl(selectedItem.value)
  isBookmarked.value = userBookmarks.value.some((b: any) => b.url === targetUrl)
}

async function addBookmark() {
  if (!selectedItem.value) return
  try {
    await $fetch('/api/bookmarks', {
      method: 'POST',
      body: {
        type: 'codifier',
        title: selectedItem.value.name,
        description: selectedItem.value.note,
        category: category.value?.name,
        url: `/codifier/${url}?id=${selectedItem.value._id}`,
        mkbCode: selectedItem.value.mkbCode,
        stationCode: selectedItem.value.stationCode
      }
    })
    isBookmarked.value = true
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Добавлено в закладки', color: 'primary' })
  } catch (e) {
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось добавить в закладки', color: 'error' })
  }
}

async function removeBookmark() {
  if (!selectedItem.value) return
  try {
    // находим id закладки по url
    const targetUrl = buildItemUrl(selectedItem.value)
    if (userBookmarks.value.length === 0) await loadBookmarks()
    const bm = userBookmarks.value.find((b: any) => b.url === targetUrl)
    if (!bm?._id) return
    await $fetch(`/api/bookmarks/${bm._id}`, { method: 'DELETE' })
    isBookmarked.value = false
    userBookmarks.value = userBookmarks.value.filter((b: any) => b._id !== bm._id)
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Удалено из закладок', color: 'neutral' })
  } catch (e) {
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось удалить из закладок', color: 'error' })
  }
}

async function toggleBookmark() {
  if (isBookmarked.value) {
    await removeBookmark()
  } else {
    await addBookmark()
  }
}

// Функция для поделиться
async function shareItem() {
  if (!selectedItem.value) return
  
  // Убеждаемся, что мета-теги установлены перед отправкой
  // Важно: изображение должно быть уже сгенерировано на сервере
  // и доступно по URL в мета-тегах og:image
  const shareUrl = window.location.href
  const imageUrl = ogImageUrl.value
  
  // Проверяем, что изображение доступно (опционально - предзагрузка)
  if (imageUrl) {
    // Предзагружаем изображение, чтобы убедиться, что оно сгенерировано
    try {
      await fetch(imageUrl, { method: 'HEAD' }).catch(() => {
        // Если не удалось загрузить, пробуем GET запрос для генерации
        return fetch(imageUrl).catch(() => null)
      })
    } catch (e) {
      console.warn('Предзагрузка изображения не удалась, но продолжаем:', e)
    }
  }
  
  const name = selectedItem.value.name || 'Кодификатор'
  const mkb = selectedItem.value.mkbCode ? `МКБ-10: ${selectedItem.value.mkbCode}` : ''
  const station = selectedItem.value.stationCode ? ` | Код станции: ${selectedItem.value.stationCode}` : ''
  const text = `${name}\n${mkb}${station}\n\n${shareUrl}`

  const shareData = {
    title: `${name} — Кодификатор`,
    text,
    url: shareUrl
  }
  
  try {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData)
    } else {
      // Fallback - копируем URL в буфер обмена
      await navigator.clipboard.writeText(shareUrl)
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Ссылка скопирована в буфер обмена', color: 'primary' })
    }
  } catch (error) {
    console.error('Ошибка при попытке поделиться:', error)
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось поделиться', color: 'error' })
  }
}

// Получить File с OG-изображением (без сохранения на устройство)
async function getOgImageFile(): Promise<File | null> {
  const imageUrl = shareOgUrl.value || ogImageUrl.value
  if (!imageUrl) return null
  try {
    const res = await fetch(imageUrl, { cache: 'no-store' })
    if (!res.ok) return null
    const blob = await res.blob()
    return new File([blob], 'codifier-og.png', { type: 'image/png' })
  } catch {
    return null
  }
}

// Поделиться изображением через Web Share API (если поддерживается)
const { shareToTelegram, shareToWhatsApp, shareNative } = useShare()
const { isSupported: wshareSupported, shareFiles: wshareFiles } = useWebShare()

async function shareImage() {
  if (!selectedItem.value) return
  if (shareMenuOpen.value) shareMenuOpen.value = false

  const file = shareFile.value || await getOgImageFile()
  const name = selectedItem.value.name || 'Кодификатор'
  const mkb = selectedItem.value.mkbCode ? `МКБ-10: ${selectedItem.value.mkbCode}` : ''
  const station = selectedItem.value.stationCode ? ` | Код станции: ${selectedItem.value.stationCode}` : ''
  const text = `${name}\n${mkb}${station}\n\n${window.location.href}`

  // 1) Нативный шаринг с файлом
  if (file && wshareSupported) {
    // Подстраховка: копируем текст заранее, т.к. некоторые приложения игнорируют text с файлами
    try { await navigator.clipboard?.writeText?.(text) } catch {}
    const res = await wshareFiles([file], { title: `${name} — Кодификатор`, text })
    if (res.success) return
  }

  // 2) Нативный шаринг без файла (текст + ссылка)
  try {
    // @ts-ignore
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      // @ts-ignore
      await navigator.share({ title: `${name} — Кодификатор`, text })
      return
    }
  } catch (_) {}

  // 3) Фолбэк: копируем подпись и сохраняем файл «в фоне»
  try { await navigator.clipboard?.writeText?.(text) } catch {}
  if (file) {
    await downloadBlob(file, 'codifier-og.png')
  }
  // @ts-ignore
  const toast = useToast?.()
  toast?.add?.({ title: 'Готово к отправке', description: 'Откройте мессенджер: подпись скопирована, файл сохранён.', color: 'primary' })
}

function shareViaWhatsApp() {
  if (!selectedItem.value) return
  const name = selectedItem.value.name || 'Кодификатор'
  const mkb = selectedItem.value.mkbCode ? `МКБ-10: ${selectedItem.value.mkbCode}` : ''
  const station = selectedItem.value.stationCode ? ` | Код станции: ${selectedItem.value.stationCode}` : ''
  const base = getBaseUrl()
  // Версионируем саму страницу, чтобы боты заново подтянули OG (обход кеша Telegram/WhatsApp)
  const v = selectedItem.value._id || Date.now()
  const shareUrl = `${base}${route.path}?id=${selectedItem.value._id}&v=${v}`
  const description = `${mkb}${station}`.trim()
  // Передаем полный текст: название + коды + ссылка
  const fullText = `${name}${description ? `\n${description}` : ''}\n\n${shareUrl}`
  shareToWhatsApp({ url: shareUrl, title: name, description: fullText })
}

function shareViaTelegram() {
  if (!selectedItem.value) return
  const name = selectedItem.value.name || 'Кодификатор'
  const mkb = selectedItem.value.mkbCode ? `МКБ-10: ${selectedItem.value.mkbCode}` : ''
  const station = selectedItem.value.stationCode ? ` | Код станции: ${selectedItem.value.stationCode}` : ''
  const base = getBaseUrl()
  const v = selectedItem.value._id || Date.now()
  const shareUrl = `${base}${route.path}?id=${selectedItem.value._id}&v=${v}`
  const description = `${mkb}${station}`.trim()
  // Передаем полный текст: название + коды + ссылка
  const fullText = `${name}${description ? `\n${description}` : ''}\n\n${shareUrl}`
  shareToTelegram({ url: shareUrl, title: name, description: fullText })
}

// Безопасная загрузка файла, не триггеря глобальные обработчики навигации
async function downloadBlob(file: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_self'
    a.rel = 'noopener noreferrer'
    // Не вставляем в DOM и не диспатчим событие — прямой вызов a.click()
    if (typeof a.click === 'function') a.click()
    // Небольшая задержка перед очисткой URL, чтобы скачать успело начаться
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (e) {
    // Фолбэк: открываем системный диалог сохранения через новый таб запрещен, поэтому показываем подсказку
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось скачать', description: 'Попробуйте ещё раз или используйте «Поделиться».', color: 'error' })
  }
}

// Явная загрузка изображения по запросу пользователя
async function downloadImage() {
  const file = await getOgImageFile()
  if (!file) {
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось получить изображение', color: 'error' })
    return
  }
  await downloadBlob(file, 'codifier-og.png')
}

// Авто-открытие по query ?open=<id> или ?mkb=<code>
const routeQuery = useRoute()


// Открытие/закрытие модалки при изменении query параметров
watch(() => [route.query.open, route.query.mkb], ([openVal, mkbVal]) => {
  const openId = openVal as string | undefined
  const mkbCode = mkbVal as string | undefined
  
  if (openId) {
    const found = items.value.find((i: any) => String(i._id) === String(openId))
    if (found) openModal(found)
  } else if (mkbCode) {
    const found = items.value.find((i: any) => i.mkbCode === mkbCode)
    if (found) openModal(found)
  } else if (modalOpen.value) {
    closeModal()
  }
})

// Отдельный watcher для id параметра
watch(() => route.query.id, (newId, oldId) => {
  
  // Пропускаем срабатывание при первоначальной загрузке страницы с параметром id
  if (newId && !oldId) {
    console.log('🔍 Пропускаем watcher при первоначальной загрузке с id')
    return
  }
  
  // Если есть новый ID и он отличается от старого
  if (newId && newId !== oldId) {
    // Ждем загрузки данных и открываем нужный элемент
    const checkAndOpenItem = () => {
      console.log('🔍 Проверка авто-открытия в watcher:', { itemsCount: items.value.length, itemId: newId })
      if (items.value.length > 0) {
        const found = items.value.find((i: any) => String(i._id) === String(newId))
        console.log('🔍 Watcher поиск элемента:', { found: !!found, foundId: found?._id, searchId: newId })
        if (found) {
          console.log('✅ Watcher открываем модалку кодификатора')
          // Открываем модалку без изменения URL
          selectedItem.value = found
          modalOpen.value = true
          updateIsBookmarked()
        } else {
          console.log('❌ Watcher элемент не найден в загруженных данных, загружаем напрямую')
          // Если элемент не найден в загруженных данных, загружаем его напрямую
          loadSpecificItem(String(newId))
        }
      } else {
        console.log('⏳ Watcher данные еще загружаются, повторяем через 100мс')
        // Данные еще загружаются, повторяем через 100мс
        setTimeout(checkAndOpenItem, 100)
      }
    }
    checkAndOpenItem()
  } else if (!newId && modalOpen.value) {
    console.log('🔍 Watcher закрываем модалку')
    // Если id убран, закрываем модалку
    modalOpen.value = false
  }
})

// Watcher для modalOpen - очищаем URL при закрытии модалки
watch(modalOpen, (newValue, oldValue) => {
  // Если модалка закрылась (была открыта, стала закрыта)
  if (oldValue === true && newValue === false) {
    // Очищаем query параметры используя прямое изменение истории браузера
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('id')
    newUrl.searchParams.delete('open')
    newUrl.searchParams.delete('mkb')
    window.history.replaceState({}, '', newUrl.toString())
  }
})
</script>
