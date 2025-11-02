<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
        <div class="mb-6 flex items-center justify-between">
          <div class="text-sm text-slate-600 dark:text-slate-300">Промо-ивенты</div>
          <UButton color="primary" class="cursor-pointer" @click="openCreate">Добавить</UButton>
        </div>

        <div class="space-y-3">
          <div v-for="e in events" :key="e._id" class="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between">
            <div class="flex items-start gap-3">
              <div class="shrink-0">
                <template v-if="isImageUrl(e.spriteIcon)">
                  <img :src="e.spriteIcon" alt="sprite" class="w-6 h-6 object-contain" />
                </template>
                <template v-else>
                  <UIcon :name="e.spriteIcon" class="w-6 h-6" />
                </template>
              </div>
              <div>
                <div class="text-base font-semibold text-slate-900 dark:text-white">{{ e.title }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">
                  <NuxtLink :to="`/promo/${e.slug}`" class="underline hover:no-underline">/{{ e.slug }}</NuxtLink>
                  · {{ formatRange(e.startAt, e.endAt) }} · нужно собрать: {{ e.requiredCount }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UBadge :color="isActive(e) ? 'primary' : 'neutral'" variant="soft">{{ isActive(e) ? 'Активен' : 'Не активен' }}</UBadge>
              <UButton size="sm" variant="soft" class="cursor-pointer" @click="openEdit(e)"><UIcon name="i-lucide-pencil" class="w-4 h-4" /></UButton>
              <UButton size="sm" color="error" variant="soft" class="cursor-pointer" @click="onDelete(e)"><UIcon name="i-lucide-trash-2" class="w-4 h-4" /></UButton>
            </div>
          </div>
        </div>

        <USlideover v-model:open="formOpen" :title="isEdit ? 'Редактировать ивент' : 'Новый ивент'" :description="isEdit ? 'Форма редактирования' : 'Форма создания'" side="right" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <nav class="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-4 overflow-x-auto">
              <button
                type="button"
                class="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                :class="activeTab === 'basic' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
                @click="activeTab = 'basic'">
                <UIcon name="i-lucide:file-text" class="w-4 h-4 mr-2" /> Основное
              </button>
              <button
                type="button"
                class="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                :class="activeTab === 'customization' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
                @click="activeTab = 'customization'">
                <UIcon name="i-lucide:palette" class="w-4 h-4 mr-2" /> Кастомизация
              </button>
              <button
                type="button"
                class="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                :class="activeTab === 'prizes' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
                @click="activeTab = 'prizes'">
                <UIcon name="i-lucide:gift" class="w-4 h-4 mr-2" /> Призы
              </button>
              <button
                type="button"
                class="flex items-center justify-center flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                :class="activeTab === 'participants' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
                @click="activeTab = 'participants'">
                <UIcon name="i-lucide:users" class="w-4 h-4 mr-2" /> Участники
              </button>
            </nav>
            <UForm :state="form" @submit.prevent="onSubmit" class="space-y-4">
              <!-- Вкладка: Основное -->
              <template v-if="isBasicTab">
              <UFormField label="Название" required>
                <UInput v-model="form.title" placeholder="Название" size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Slug" required>
                <UInput v-model="form.slug" placeholder="naprimer-halloween" size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Описание">
                <UTextarea v-model="form.description" :rows="6" placeholder="Поддерживается Markdown (заголовки, списки, **жирный**, _курсив_, ссылки)" size="lg" class="w-full" />
                <div class="text-xs text-slate-500 mt-1">Можно использовать Markdown. Например: <code>**жирный**</code>, <code>_курсив_</code>, <code>- список</code>.</div>
                <div v-if="form.description" class="mt-3">
                  <div class="text-xs text-slate-500 mb-1">Предпросмотр:</div>
                  <div class="prose dark:prose-invert max-w-none p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                       v-html="renderDescriptionAdmin(form.description)"></div>
                </div>
              </UFormField>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <UFormField label="Дата начала" required>
                  <UInput v-model="form.startAt" type="date" size="lg" class="w-full" />
                </UFormField>
                <UFormField label="Дата окончания" required>
                  <UInput v-model="form.endAt" type="date" size="lg" class="w-full" />
                </UFormField>
              </div>
              <UFormField label="Дата розыгрыша">
                <UInput v-model="form.drawAt" type="date" size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Нужно собрать (шт.)" required>
                <UInput v-model.number="form.requiredCount" type="number" min="1" size="lg" class="w-full" />
              </UFormField>
              <UCheckbox v-model="form.isRecurring" label="Повторяющийся ивент (активируется каждый год в установленные даты)" />
              <UCheckbox v-model="form.published" label="Опубликовано" />
              </template>

              <!-- Вкладка: Кастомизация -->
              <template v-if="isCustomizationTab">
              <UFormField label="Иконка/спрайт (UIcon или загрузка)" required>
                <div class="flex items-center gap-2">
                  <UInput v-model="form.spriteIcon" size="lg" placeholder="например, i-lucide-ghost или URL" class="flex-1" />
                  <input ref="spriteFile" type="file" accept=".svg,image/*" class="hidden" @change="onUploadSprite" />
                  <UButton color="neutral" variant="soft" class="cursor-pointer" @click="() => spriteFile?.click()">
                    <UIcon name="i-lucide-upload" class="w-4 h-4 mr-1" />Загрузить
                  </UButton>
                </div>
                <div v-if="isImageUrl(form.spriteIcon)" class="mt-2 flex items-center gap-2">
                  <img :src="form.spriteIcon" alt="sprite" class="h-8 w-8 object-contain" />
                  <span class="text-xs text-slate-500">Превью</span>
                </div>
              </UFormField>
              <div class="grid grid-cols-1 gap-3">
                <UFormField label="Тематический логотип (UIcon/класс или загрузка)">
                  <div class="flex items-center gap-2">
                    <UInput v-model="form.themeLogo" size="lg" placeholder="опционально: UIcon, класс или URL" class="flex-1" />
                    <input ref="logoFile" type="file" accept=".svg,image/*" class="hidden" @change="onUploadLogo" />
                    <UButton color="neutral" variant="soft" class="cursor-pointer" @click="() => logoFile?.click()">
                      <UIcon name="i-lucide-upload" class="w-4 h-4 mr-1" />Загрузить
                    </UButton>
                  </div>
                  <div v-if="isImageUrl(form.themeLogo)" class="mt-2 flex items-center gap-2">
                    <img :src="form.themeLogo" alt="logo" class="h-8 w-8 object-contain" />
                    <span class="text-xs text-slate-500">Превью</span>
                  </div>
                </UFormField>
                <UFormField label="Логотип мероприятия (изображение)">
                  <div class="flex items-center gap-2">
                    <UInput v-model="form.eventLogoUrl" size="lg" placeholder="URL или загрузите файл" class="flex-1" />
                    <input ref="eventLogoFile" type="file" accept=".svg,image/*" class="hidden" @change="onUploadEventLogo" />
                    <UButton color="neutral" variant="soft" class="cursor-pointer" @click="() => eventLogoFile?.click()">
                      <UIcon name="i-lucide-upload" class="w-4 h-4 mr-1" />Загрузить
                    </UButton>
                  </div>
                  <div v-if="isImageUrl(form.eventLogoUrl)" class="mt-2 flex items-center gap-2">
                    <img :src="form.eventLogoUrl" alt="event-logo" class="h-12 w-auto object-contain" />
                    <span class="text-xs text-slate-500">Превью</span>
                  </div>
                </UFormField>
                <UFormField label="Фоновое изображение лендинга">
                  <div class="flex items-center gap-2">
                    <UInput v-model="form.bgImageUrl" size="lg" placeholder="URL или загрузите файл" class="flex-1" />
                    <input ref="bgFile" type="file" accept=".svg,image/*" class="hidden" @change="onUploadBg" />
                    <UButton color="neutral" variant="soft" class="cursor-pointer" @click="() => bgFile?.click()">
                      <UIcon name="i-lucide-upload" class="w-4 h-4 mr-1" />Загрузить
                    </UButton>
                  </div>
                </UFormField>
                <UFormField label="Цвет темы (Tailwind класс)">
                  <UInput v-model="form.themeColor" size="lg" class="w-full" placeholder="например, orange" />
                </UFormField>
                <UFormField label="Цвет фона (Tailwind класс)">
                  <UInput v-model="form.themeBgColor" size="lg" class="w-full" placeholder="например, slate" />
                </UFormField>
                <UFormField label="Основной акцент (Tailwind класс)">
                  <UInput v-model="form.themePrimaryColor" size="lg" class="w-full" placeholder="например, orange" />
                </UFormField>
                <UFormField label="Второстепенный акцент (Tailwind класс)">
                  <UInput v-model="form.themeSecondaryColor" size="lg" class="w-full" placeholder="например, purple" />
                </UFormField>
                <UFormField label="Цвет текста (основной, Tailwind класс)">
                  <UInput v-model="form.themeTextPrimaryColor" size="lg" class="w-full" placeholder="например, orange" />
                </UFormField>
                <UFormField label="Цвет текста (второстепенный, Tailwind класс)">
                  <UInput v-model="form.themeTextSecondaryColor" size="lg" class="w-full" placeholder="например, slate" />
                </UFormField>
              </div>
              <UFormField label="Прозрачность панелей (%)">
                <UInput v-model.number="form.panelOpacity" type="number" min="0" max="100" size="lg" class="w-full" placeholder="например, 8" />
              </UFormField>
              <UFormField label="Шанс спауна спрайта (%)">
                <UInput v-model.number="form.spawnChance" type="number" min="0" max="100" size="lg" class="w-full" placeholder="100 = всегда, 0 = никогда" />
                <div class="text-xs text-slate-500 mt-1">Вероятность появления спрайта на странице (0–100%)</div>
              </UFormField>
              </template>

              <!-- Вкладка: Призы -->
              <template v-if="isPrizesTab">
                <div v-if="!form._id" class="text-sm text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  Сначала сохраните ивент, чтобы добавить призы
                </div>
                <div v-else class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="text-sm font-medium text-slate-900 dark:text-white">Призы для розыгрыша</div>
                    <UButton v-if="!prizeEditorOpen" size="sm" color="primary" @click="openPrizeEditor()">
                      <UIcon name="i-lucide-plus" class="w-4 h-4 mr-1" /> Добавить приз
                    </UButton>
                    <UButton v-else size="sm" variant="soft" color="neutral" @click="closePrizeEditor()">
                      Отмена
                    </UButton>
                  </div>
                  
                  <!-- Форма добавления/редактирования приза (без вложенного <form>) -->
                  <div v-if="prizeEditorOpen" class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div class="text-sm font-medium text-slate-900 dark:text-white mb-4">
                      {{ prizeEditorMode === 'edit' ? 'Редактировать приз' : 'Новый приз' }}
                    </div>
                    <div class="space-y-4">
                      <UFormField label="Название приза" required>
                        <UInput v-model="prizeForm.title" placeholder="Название приза" size="lg" class="w-full" />
                      </UFormField>
                      <UFormField label="Описание">
                        <UTextarea v-model="prizeForm.description" :rows="3" placeholder="Описание приза" size="lg" class="w-full" />
                      </UFormField>
                      <UFormField label="Изображение приза">
                        <div class="flex items-center gap-2">
                          <UInput v-model="prizeForm.imageUrl" size="lg" placeholder="URL или загрузите файл" class="flex-1" />
                          <input ref="prizeImageFile" type="file" accept=".svg,image/*" class="hidden" @change="onUploadPrizeImage" />
                          <UButton color="neutral" variant="soft" class="cursor-pointer" @click="() => prizeImageFile?.click()" type="button">
                            <UIcon name="i-lucide-upload" class="w-4 h-4 mr-1" />Загрузить
                          </UButton>
                        </div>
                        <div v-if="isImageUrl(prizeForm.imageUrl)" class="mt-2 flex items-center gap-2">
                          <img :src="prizeForm.imageUrl" alt="prize" class="h-16 w-16 object-contain rounded" />
                          <span class="text-xs text-slate-500">Превью</span>
                        </div>
                      </UFormField>
                      <UFormField label="Порядок сортировки">
                        <UInput v-model.number="prizeForm.order" type="number" size="lg" class="w-full" placeholder="0" />
                      </UFormField>
                      <div class="flex items-center gap-2 pt-2">
                        <UButton type="button" color="primary" size="lg" @click="onPrizeSubmit">
                          Сохранить
                        </UButton>
                        <UButton type="button" variant="soft" color="neutral" size="lg" @click="closePrizeEditor()">Отмена</UButton>
                      </div>
                    </div>
                  </div>

                  <!-- Список призов -->
                  <div v-if="prizes.length === 0 && !prizeEditorOpen" class="text-sm text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    Призы ещё не добавлены
                  </div>
                  <div v-else-if="prizes.length > 0" class="space-y-3">
                    <div v-for="(prize, idx) in prizes" :key="prize._id || idx" class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <div class="flex items-start gap-3">
                        <div v-if="isImageUrl(prize.imageUrl)" class="shrink-0">
                          <img :src="prize.imageUrl" alt="prize" class="h-16 w-16 object-contain rounded" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-base font-semibold text-slate-900 dark:text-white">{{ prize.title }}</div>
                          <div v-if="prize.description" class="text-sm text-slate-600 dark:text-slate-400 mt-1">{{ prize.description }}</div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                          <UButton size="sm" variant="soft" @click="openPrizeEditor(prize)">
                            <UIcon name="i-lucide-pencil" class="w-4 h-4" />
                          </UButton>
                          <UButton size="sm" color="error" variant="soft" @click="onDeletePrize(prize._id)">
                            <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Вкладка: Участники -->
              <template v-if="isParticipantsTab">
                <div v-if="!form._id" class="text-sm text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  Сначала сохраните ивент, чтобы просмотреть участников
                </div>
                <div v-else class="space-y-4">
                  <div class="flex flex-col gap-2">
                    <div class="text-sm font-medium text-slate-900 dark:text-white">
                      Участники розыгрыша ({{ participants.length }})
                    </div>
                    <div class="flex items-center gap-2">
                      <UButton size="lg" variant="soft" color="neutral" @click="loadParticipants(form._id)" :disabled="loadingParticipants">
                        <UIcon v-if="loadingParticipants" name="i-lucide-loader-2" class="animate-spin w-4 h-4 mr-1" />
                        <UIcon v-else name="i-lucide-refresh-cw" class="w-4 h-4 mr-1" />
                        Обновить
                      </UButton>
                      <UButton size="lg" color="warning" variant="soft" @click="handleDraw" :disabled="loadingDraw || participants.length === 0">
                        <UIcon name="i-lucide-sparkles" class="w-4 h-4 mr-1" /> Провести розыгрыш
                      </UButton>
                    </div>
                  </div>
                  <div v-if="participants.length === 0" class="text-sm text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    Участники ещё не зарегистрированы
                  </div>
                  <div v-else class="space-y-3">
                    <div v-for="(participant, idx) in participants" :key="participant._id || idx" 
                         class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <div class="flex items-center gap-3">
                        <div class="shrink-0">
                          <UAvatar v-if="participant.userId?.avatarUrl" :src="participant.userId.avatarUrl" 
                                   :alt="participant.userId?.firstName || participant.userId?.email || 'Пользователь'" />
                          <UAvatar v-else :alt="participant.userId?.firstName || participant.userId?.email || 'Пользователь'">
                            {{ ((participant.userId?.firstName?.[0] || participant.userId?.email?.[0] || 'П') || 'П').toUpperCase() }}
                          </UAvatar>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-base font-semibold text-slate-900 dark:text-white">
                            {{ participant.userId ? `${participant.userId.firstName || ''} ${participant.userId.lastName || ''}`.trim() || participant.userId.email : 'Неизвестный пользователь' }}
                          </div>
                          <div class="text-sm text-slate-600 dark:text-slate-400">
                            {{ participant.userId?.email || '' }}
                          </div>
                          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Участвует с: {{ new Date(participant.participatedAt).toLocaleString('ru-RU') }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </UForm>
          </template>
          <template #footer>
            <div class="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <template v-if="isEdit">
                <UButton color="warning" variant="soft" size="lg" @click="onResetEvent(form._id)" :disabled="resetting">
                  <template v-if="resetting">
                    <UIcon name="i-lucide-loader-2" class="animate-spin w-4 h-4 mr-1" />
                    <span>Обнуление…</span>
                  </template>
                  <template v-else>
                    <span>Обнулить</span>
                  </template>
                </UButton>
                <UButton color="error" variant="soft" size="lg" @click="onDeleteById(form._id)">Удалить</UButton>
              </template>
              <UButton type="submit" color="primary" size="lg" class="sm:ml-auto" @click="onSubmit" :disabled="saving">
                <template v-if="saving">
                  <UIcon name="i-lucide-loader-2" class="animate-spin w-4 h-4" />
                  <span>Сохранение…</span>
                </template>
                <template v-else-if="savedState">
                  <UIcon name="i-lucide-check" class="w-4 h-4" />
                  <span>Сохранено</span>
                </template>
                <template v-else>
                  <span>Сохранить</span>
                </template>
              </UButton>
            </div>
          </template>
        </USlideover>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin', headerTitle: 'Промо' })

const items = ref<any[]>([])
const events = computed(() => items.value)
const formOpen = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const savedState = ref(false)
const activeTab = ref<string>('basic')
const isBasicTab = computed(() => activeTab.value === 'basic')
const isCustomizationTab = computed(() => activeTab.value === 'customization')
const isPrizesTab = computed(() => activeTab.value === 'prizes')
const isParticipantsTab = computed(() => activeTab.value === 'participants')
const form = reactive<any>({ _id: undefined, title: '', slug: '', description: '', startAt: '', endAt: '', drawAt: '', requiredCount: 5, spriteIcon: 'i-lucide-ghost', themeLogo: '', eventLogoUrl: '', bgImageUrl: '', themeColor: 'orange', themeBgColor: 'slate', themePrimaryColor: 'orange', themeSecondaryColor: 'purple', themeTextPrimaryColor: '', themeTextSecondaryColor: '', panelOpacity: 8, spawnChance: 100, published: true, isRecurring: false })
const prizes = ref<any[]>([])
const prizeEditorOpen = ref(false)
const prizeEditorMode = ref<'create' | 'edit'>('create')
const prizeForm = reactive<any>({ _id: undefined, title: '', description: '', imageUrl: '', order: 0 })
const prizeImageFile = ref<HTMLInputElement | null>(null)
const participants = ref<any[]>([])
const loadingDraw = ref<boolean>(false)
const resetting = ref<boolean>(false)
const loadingParticipants = ref<boolean>(false)

function resetForm() {
  form._id = undefined
  form.title = ''
  form.slug = ''
  form.description = ''
  form.startAt = ''
  form.endAt = ''
  form.drawAt = ''
  form.requiredCount = 5
  form.spriteIcon = 'i-lucide-ghost'
  form.themeLogo = ''
  form.eventLogoUrl = ''
  form.bgImageUrl = ''
  form.themeColor = 'orange'
  form.themeBgColor = 'slate'
  form.themePrimaryColor = 'orange'
  form.themeSecondaryColor = 'purple'
  form.themeTextPrimaryColor = ''
  form.themeTextSecondaryColor = ''
  form.panelOpacity = 8
  form.spawnChance = 100
  form.published = true
  form.isRecurring = false
}

function isActive(e: any) {
  if (!e.published) return false
  const now = new Date()
  const startDate = new Date(e.startAt)
  const endDate = new Date(e.endAt)
  
  if (e.isRecurring) {
    // Для повторяющихся ивентов проверяем по месяцу и дню
    const currentMonth = now.getMonth()
    const currentDate = now.getDate()
    const startMonth = startDate.getMonth()
    const startDay = startDate.getDate()
    const endMonth = endDate.getMonth()
    const endDay = endDate.getDate()
    
    const currentMonthDay = currentMonth * 100 + currentDate
    const startMonthDay = startMonth * 100 + startDay
    const endMonthDay = endMonth * 100 + endDay
    
    if (startMonthDay <= endMonthDay) {
      return currentMonthDay >= startMonthDay && currentMonthDay <= endMonthDay
    } else {
      // Диапазон переходит через новый год
      return currentMonthDay >= startMonthDay || currentMonthDay <= endMonthDay
    }
  } else {
    // Для не повторяющихся ивентов проверяем полную дату
    return startDate <= now && endDate >= now
  }
}

function formatRange(a: any, b: any) {
  try {
    const da = new Date(a), db = new Date(b)
    return `${da.toLocaleDateString()} — ${db.toLocaleDateString()}`
  } catch { return '' }
}

async function loadItems() {
  try {
    const res: any = await $fetch('/api/promo', { cache: 'no-cache' as any, query: { _ts: Date.now() } })
    if (res?.success) items.value = Array.isArray(res.items) ? res.items : []
  } catch (e) { console.error(e) }
}

async function loadPrizes(eventId?: string) {
  if (!eventId) { prizes.value = []; return }
  try {
    const res: any = await $fetch(`/api/promo/prizes?eventId=${eventId}&_ts=${Date.now()}`, { cache: 'no-cache' as any })
    if (res?.success) prizes.value = Array.isArray(res.prizes) ? res.prizes : []
    else prizes.value = []
  } catch (e) {
    console.error('Ошибка загрузки призов:', e)
    prizes.value = []
  }
}
async function loadParticipants(eventId?: string) {
  if (!eventId) { participants.value = []; return }
  try {
    loadingParticipants.value = true
    const res: any = await $fetch(`/api/promo/participants?eventId=${eventId}&_ts=${Date.now()}`, { cache: 'no-cache' as any })
    if (res?.success) {
      participants.value = Array.isArray(res.participants) ? res.participants : []
    } else {
      participants.value = []
    }
  } catch (e) {
    console.error('Ошибка загрузки участников:', e)
    participants.value = []
  } finally {
    loadingParticipants.value = false
  }
}

function openCreate() {
  resetForm(); isEdit.value = false; activeTab.value = 'basic'; prizes.value = []; participants.value = []; formOpen.value = true
}
async function openEdit(e: any) {
  form._id = e._id
  form.title = e.title
  form.slug = e.slug
  form.description = e.description || ''
  form.startAt = e.startAt ? new Date(e.startAt).toISOString().substring(0,10) : ''
  form.endAt = e.endAt ? new Date(e.endAt).toISOString().substring(0,10) : ''
  form.drawAt = e.drawAt ? new Date(e.drawAt).toISOString().substring(0,10) : ''
  form.requiredCount = e.requiredCount || 5
  form.spriteIcon = e.spriteIcon || 'i-lucide-ghost'
  form.themeLogo = e.themeLogo || ''
  form.eventLogoUrl = e.eventLogoUrl || ''
  form.bgImageUrl = e.bgImageUrl || ''
  form.themeColor = e.themeColor || 'orange'
  form.themeBgColor = e.themeBgColor || 'slate'
  form.themePrimaryColor = e.themePrimaryColor || form.themeColor || 'orange'
  form.themeSecondaryColor = e.themeSecondaryColor || 'purple'
  form.themeTextPrimaryColor = e.themeTextPrimaryColor || ''
  form.themeTextSecondaryColor = e.themeTextSecondaryColor || ''
  form.panelOpacity = typeof e.panelOpacity === 'number' ? e.panelOpacity : 8
  form.spawnChance = typeof e.spawnChance === 'number' ? e.spawnChance : 100
  form.published = e.published ?? true
  form.isRecurring = e.isRecurring ?? false
  isEdit.value = true
  activeTab.value = 'basic'
  await loadPrizes(e._id)
  await loadParticipants(e._id)
  formOpen.value = true
}

async function onSubmit() {
  try {
    saving.value = true
    savedState.value = false
    const body = { ...form }
    let savedItem: any = null
    if (isEdit.value && form._id) {
      const res: any = await $fetch(`/api/promo/${form._id}`, { method: 'PATCH', body })
      savedItem = res?.item
    } else {
      const res: any = await $fetch('/api/promo', { method: 'POST', body })
      savedItem = res?.item
    }
    // Обновляем глобальное состояние активного ивента (для шапки) и сигнализируем о смене
    try {
      const active = savedItem && isActive(savedItem)
      if (active) {
        const promoState = useState<any>('active_promo')
        promoState.value = savedItem
      }
      if (savedItem?.slug) {
        localStorage.setItem('promo_updated', JSON.stringify({ slug: savedItem.slug, ts: Date.now() }))
      }
    } catch {}
    // Обновляем список без перезагрузки страницы
    if (savedItem && savedItem._id) {
      const idx = items.value.findIndex((i: any) => i._id === savedItem._id)
      if (idx !== -1) items.value.splice(idx, 1, savedItem)
      else items.value.unshift(savedItem)
    } else {
      await loadItems()
    }
    // Оставляем слайдовер открытым и перезаполняем форму сохранёнными данными
    if (savedItem) {
      await loadPrizes(savedItem._id)
      await loadParticipants(savedItem._id)
      // Обновляем форму, но не вызываем openEdit, чтобы не сбросить активную вкладку
      form._id = savedItem._id
      form.title = savedItem.title
      form.slug = savedItem.slug
      form.description = savedItem.description || ''
      form.startAt = savedItem.startAt ? new Date(savedItem.startAt).toISOString().substring(0,10) : ''
      form.endAt = savedItem.endAt ? new Date(savedItem.endAt).toISOString().substring(0,10) : ''
      form.drawAt = savedItem.drawAt ? new Date(savedItem.drawAt).toISOString().substring(0,10) : ''
      form.requiredCount = savedItem.requiredCount || 5
      form.spriteIcon = savedItem.spriteIcon || 'i-lucide-ghost'
      form.themeLogo = savedItem.themeLogo || ''
      form.eventLogoUrl = savedItem.eventLogoUrl || ''
      form.bgImageUrl = savedItem.bgImageUrl || ''
      form.themeColor = savedItem.themeColor || 'orange'
      form.themeBgColor = savedItem.themeBgColor || 'slate'
      form.themePrimaryColor = savedItem.themePrimaryColor || form.themeColor || 'orange'
      form.themeSecondaryColor = savedItem.themeSecondaryColor || 'purple'
      form.themeTextPrimaryColor = savedItem.themeTextPrimaryColor || ''
      form.themeTextSecondaryColor = savedItem.themeTextSecondaryColor || ''
      form.panelOpacity = typeof savedItem.panelOpacity === 'number' ? savedItem.panelOpacity : 8
      form.spawnChance = typeof savedItem.spawnChance === 'number' ? savedItem.spawnChance : 100
      form.published = savedItem.published ?? true
      form.isRecurring = savedItem.isRecurring ?? false
    }
    // UI состояния кнопки
    savedState.value = true
    setTimeout(() => { savedState.value = false }, 1800)
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}

// Функции для работы с призами
function resetPrizeForm() {
  prizeForm._id = undefined
  prizeForm.title = ''
  prizeForm.description = ''
  prizeForm.imageUrl = ''
  prizeForm.order = 0
}
function openPrizeEditor(prize?: any) {
  if (prize) {
    prizeForm._id = prize._id
    prizeForm.title = prize.title || ''
    prizeForm.description = prize.description || ''
    prizeForm.imageUrl = prize.imageUrl || ''
    prizeForm.order = prize.order || 0
    prizeEditorMode.value = 'edit'
  } else {
    resetPrizeForm()
    prizeEditorMode.value = 'create'
  }
  prizeEditorOpen.value = true
}
function closePrizeEditor() {
  prizeEditorOpen.value = false
  resetPrizeForm()
}
async function onPrizeSubmit() {
  if (!prizeForm.title || !form._id) return
  try {
    const body = { ...prizeForm, eventId: form._id }
    let saved: any = null
    if (prizeEditorMode.value === 'edit' && prizeForm._id) {
      const res: any = await $fetch(`/api/promo/prizes/${prizeForm._id}`, { method: 'PATCH', body })
      saved = res?.prize
      if (saved) {
        // Реактивно обновляем существующий приз
        const idx = prizes.value.findIndex((p: any) => p._id === saved._id)
        if (idx !== -1) {
          prizes.value[idx] = saved
        } else {
          prizes.value.push(saved)
        }
      }
    } else {
      const res: any = await $fetch('/api/promo/prizes', { method: 'POST', body })
      saved = res?.prize
      if (saved) {
        // Реактивно добавляем новый приз
        prizes.value.push(saved)
        // Сортируем по order
        prizes.value.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      }
    }
    if (saved) {
      // Синхронизируем с сервером для актуальности данных
      await loadPrizes(form._id)
      prizeEditorOpen.value = false
      resetPrizeForm()
    }
  } catch (e) { console.error(e) }
}
async function onDeletePrize(id?: string) {
  if (!id) return
  try {
    await $fetch(`/api/promo/prizes/${id}`, { method: 'DELETE' })
    // Реактивно удаляем приз из списка
    const idx = prizes.value.findIndex((p: any) => p._id === id)
    if (idx !== -1) {
      prizes.value.splice(idx, 1)
    }
    // Синхронизируем с сервером для актуальности данных
    await loadPrizes(form._id)
  } catch (e) { console.error(e) }
}
async function handleDraw() {
  if (!form._id || loadingDraw.value) return
  if (participants.value.length === 0) {
    const toast = useToast()
    toast.add({ title: 'Нет участников для розыгрыша', color: 'error' })
    return
  }
  if (prizes.value.length === 0) {
    const toast = useToast()
    toast.add({ title: 'Нет призов для розыгрыша', color: 'error' })
    return
  }
  if (!confirm(`Провести розыгрыш среди ${participants.value.length} участников? Будет выбрано ${Math.min(prizes.value.length, participants.value.length)} победителей.`)) {
    return
  }
  try {
    loadingDraw.value = true
    const res: any = await $fetch('/api/promo/draw', {
      method: 'POST',
      body: { eventId: form._id }
    })
    if (res?.success) {
      const toast = useToast()
      toast.add({ title: `Розыгрыш проведен! Выбрано ${res.winners?.length || 0} победителей`, color: 'success' })
      // Обновляем список участников
      await loadParticipants(form._id)
    } else {
      const toast = useToast()
      toast.add({ title: res?.message || 'Ошибка проведения розыгрыша', color: 'error' })
    }
  } catch (e: any) {
    const toast = useToast()
    toast.add({ title: e?.message || 'Ошибка проведения розыгрыша', color: 'error' })
  } finally {
    loadingDraw.value = false
  }
}
async function onResetEvent(id?: string) {
  if (!id || resetting.value) return
  if (!confirm('Вы уверены, что хотите обнулить ивент? Это действие удалит всех участников, обнулит счетчики собранных изображений и удалит всех победителей. Это действие нельзя отменить.')) {
    return
  }
  try {
    resetting.value = true
    const res: any = await $fetch('/api/promo/reset', {
      method: 'POST',
      body: { eventId: id }
    })
    if (res?.success) {
      const toast = useToast()
      toast.add({
        title: 'Ивент успешно обнулен',
        description: `Удалено участников: ${res.deleted?.participants || 0}, обнулено прогрессов: ${res.deleted?.progress || 0}, удалено победителей: ${res.deleted?.winners || 0}`,
        color: 'success'
      })
      // Обновляем список участников после обнуления
      if (activeTab.value === 'participants') {
        await loadParticipants(id)
      }
      // Если мы на вкладке участников, список уже обновлен выше
    } else {
      const toast = useToast()
      toast.add({ title: res?.message || 'Ошибка обнуления ивента', color: 'error' })
    }
  } catch (e: any) {
    const toast = useToast()
    toast.add({ title: e?.message || 'Ошибка обнуления ивента', color: 'error' })
  } finally {
    resetting.value = false
  }
}
async function onUploadPrizeImage(e: Event) {
  const f = (e.target as HTMLInputElement)?.files?.[0]
  if (!f) return
  try { prizeForm.imageUrl = await uploadAndGetUrl(f) } catch (err) { console.error(err) }
  ;(e.target as HTMLInputElement).value = ''
}

async function onDelete(e: any) { await onDeleteById(e._id) }
async function onDeleteById(id?: string) {
  if (!id) return
  try {
    await $fetch(`/api/promo/${id}`, { method: 'DELETE' })
    await loadItems()
  } catch (e) { console.error(e) }
}

// Автоматическое обновление данных при переключении вкладок
watch(activeTab, async (newTab) => {
  if (!form._id || !isEdit.value) return
  if (newTab === 'prizes') {
    await loadPrizes(form._id)
  } else if (newTab === 'participants') {
    await loadParticipants(form._id)
  }
})

onMounted(() => { loadItems() })

// Upload helpers
const spriteFile = ref<HTMLInputElement | null>(null)
const logoFile = ref<HTMLInputElement | null>(null)
const eventLogoFile = ref<HTMLInputElement | null>(null)
const bgFile = ref<HTMLInputElement | null>(null)
function isImageUrl(v: string) { return typeof v === 'string' && (v.startsWith('/uploads/') || v.startsWith('http')) }
async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
}
async function uploadAndGetUrl(file?: File) {
  if (!file) return ''
  const data = await fileToDataUrl(file)
  const res: any = await $fetch('/api/promo/upload', { method: 'POST', body: { filename: file.name, data } })
  return String(res?.url || '')
}
async function onUploadSprite(e: Event) {
  const f = (e.target as HTMLInputElement)?.files?.[0]
  if (!f) return
  try { form.spriteIcon = await uploadAndGetUrl(f) } catch (err) { console.error(err) }
  ;(e.target as HTMLInputElement).value = ''
}
async function onUploadLogo(e: Event) {
  const f = (e.target as HTMLInputElement)?.files?.[0]
  if (!f) return
  try { form.themeLogo = await uploadAndGetUrl(f) } catch (err) { console.error(err) }
  ;(e.target as HTMLInputElement).value = ''
}
async function onUploadEventLogo(e: Event) {
  const f = (e.target as HTMLInputElement)?.files?.[0]
  if (!f) return
  try { form.eventLogoUrl = await uploadAndGetUrl(f) } catch (err) { console.error(err) }
  ;(e.target as HTMLInputElement).value = ''
}
async function onUploadBg(e: Event) {
  const f = (e.target as HTMLInputElement)?.files?.[0]
  if (!f) return
  try { form.bgImageUrl = await uploadAndGetUrl(f) } catch (err) { console.error(err) }
  ;(e.target as HTMLInputElement).value = ''
}

//

// Markdown preview renderer (admin-only)
import { marked } from 'marked'
marked.setOptions({ gfm: true, breaks: true })
let sanitizeHtmlAdmin: (h: string) => string = (h) => h
if (process.client) {
  const mod: any = await import('dompurify')
  const createDOMPurify = mod.default
  const purifier = createDOMPurify(window)
  sanitizeHtmlAdmin = (h: string) => purifier.sanitize(h)
}
function renderDescriptionAdmin(text?: string) {
  if (!text) return ''
  const raw = text.replace(/\r\n?/g, '\n')
  const html = marked.parse(raw) as string
  return sanitizeHtmlAdmin(html)
}
</script>


