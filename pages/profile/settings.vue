<template>
  <div class="space-y-6">
    <!-- Отдельный блок: Аватар (карточка) -->
    <div
      class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 p-2 sm:p-3 rounded-lg border-2 transition-colors"
      :class="isDragging ? 'border-dashed border-primary/50 bg-primary/5' : 'border-transparent'"
      @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
      <div class="flex flex-col md:flex-row items-center md:items-stretch gap-4">
        <div class="flex-shrink-0 w-24 h-24 md:w-16 md:h-16 mx-auto md:mx-0">
          <button type="button" class="relative group cursor-pointer block w-full h-full overflow-hidden" @click="openFilePicker" aria-label="Загрузить аватар">
            <UAvatar
              :src="form.avatarUrl || user.value?.avatarUrl || user.value?.telegram?.photo_url"
              :alt="(form.firstName + ' ' + form.lastName).trim()"
              :ui="{ root: 'rounded-full', image: 'object-cover', fallback: 'rounded-full' }"
              class="h-full w-full"
            />
            <div class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <UIcon name="i-lucide-camera" class="w-6 h-6 text-white" />
            </div>
          </button>
        </div>
        <div class="flex-1 space-y-2" ref="rightBoxRef">
          <div class="flex items-stretch gap-2 w-full">
            <UInput v-model="form.avatarUrl" placeholder="Ссылка на изображение" size="lg" class="flex-1 w-full" :input-class="'px-4 py-3'" />
            <UButton color="neutral" variant="ghost" size="lg" :icon="'i-lucide-trash-2'" class="shrink-0 cursor-pointer" aria-label="Удалить аватар" @click="clearAvatar" />
          </div>
          
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-0">Перетащите изображение сюда или кликните по
            аватару для загрузки</div>
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-300">Настройки профиля</p>
      </div>
      <div class="p-4 sm:p-6">
        <UForm :state="form" @submit.prevent="onSubmit" class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <UFormField label="Имя" required>
              <UInput v-model="form.firstName" placeholder="Ваше имя" class="w-full" size="xl"
                :input-class="'px-4 py-3'" />
            </UFormField>
            <UFormField label="Фамилия" required>
              <UInput v-model="form.lastName" placeholder="Ваша фамилия" class="w-full" size="xl"
                :input-class="'px-4 py-3'" />
            </UFormField>
            <UFormField label="Дата рождения">
              <UInput v-model="form.dateOfBirth" type="date" class="w-full" size="xl" :input-class="'px-4 py-3'" :disabled="hasSavedDateOfBirth" />
              <span v-if="hasSavedDateOfBirth" class="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Дата рождения не может быть изменена после сохранения</span>
            </UFormField>
          </div>
          <UFormField label="Email" required>
            <UInput v-model="form.email" placeholder="you@example.com" type="email" class="w-full" size="xl"
              :input-class="'px-4 py-3'" />
          </UFormField>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UFormField label="Город работы">
              <UInput v-model="form.city" placeholder="Город" class="w-full" size="xl" :input-class="'px-4 py-3'" />
            </UFormField>
            <UFormField label="Подстанция">
              <UInputMenu v-model="selectedSubstation" :items="substationItems" value-key="id"
                placeholder="Выберите подстанцию" :content="{ side: 'bottom', sideOffset: 8 }" size="xl"
                class="w-full" />
            </UFormField>
          </div>
          <div class="flex items-center justify-end gap-2">
            <UButton color="neutral" variant="ghost" type="button" @click="resetForm" class="cursor-pointer">Сбросить
            </UButton>
            <UButton color="primary" :loading="pending" class="cursor-pointer" @click="onSubmit">Сохранить</UButton>
          </div>
        </UForm>
      </div>
    </div>

    <!-- Смена пароля -->
    <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-300">Смена пароля</p>
      </div>
      <div class="p-4 sm:p-6">
        <UForm :state="pwd" @submit.prevent="onChangePassword" class="space-y-4">
          <UFormField label="Текущий пароль" required>
            <UInput v-model="pwd.currentPassword" type="password" placeholder="••••••" class="w-full" size="lg"
              :input-class="'px-4 py-3'" />
          </UFormField>
          <div class="space-y-2">
            <UFormField label="Новый пароль" required>
              <UInput v-model="pwd.newPassword" :type="showNew ? 'text' : 'password'" placeholder="Новый пароль"
                class="w-full" size="lg" :color="pwdStrengthColor" :aria-invalid="pwdScore < 4"
                aria-describedby="password-strength" :ui="{ trailing: 'pe-1' }">
                <template #trailing>
                  <UButton color="neutral" variant="link" size="sm"
                    :icon="showNew ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :aria-label="showNew ? 'Скрыть пароль' : 'Показать пароль'" :aria-pressed="showNew"
                    aria-controls="password" @click="showNew = !showNew" />
                </template>
              </UInput>
            </UFormField>

            <UProgress :color="pwdStrengthColor" :indicator="pwdStrengthText" :model-value="pwdScore" :max="4"
              size="sm" />

            <p id="password-strength" class="text-sm font-medium">
              {{ pwdStrengthText }}. Должен содержать:
            </p>
            <ul class="space-y-1" aria-label="Требования к паролю">
              <li v-for="(req, idx) in pwdStrength" :key="idx" class="flex items-center gap-1"
                :class="req.met ? 'text-success' : 'text-muted'">
                <UIcon :name="req.met ? 'i-lucide-circle-check' : 'i-lucide-circle-x'" class="size-4 shrink-0" />
                <span class="text-xs">{{ req.text }}</span>
              </li>
            </ul>
          </div>
          <div class="flex items-center justify-end gap-2">
            <UButton color="primary" :loading="pendingPwd" class="cursor-pointer" @click="onChangePassword">Обновить
              пароль
            </UButton>
          </div>
        </UForm>
      </div>
    </div>

    <!-- Подключение Telegram -->
    <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-300">Подключение Telegram</p>
      </div>

      <ul class="grid grid-cols-1 gap-0" v-if="currentUser">
        <li v-if="currentUser.telegram?.id"
          class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <UIcon name="i-logos-telegram" class="w-5 h-5 flex-shrink-0" />
                <p class="text-slate-900 dark:text-white font-medium truncate">
                  Telegram подключен
                </p>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
                @{{ currentUser.telegram.username || 'username' }}
              </p>
            </div>

            <!-- Выпадающее меню -->
            <div class="relative" ref="telegramMenuRef">
              <button @click="telegramMenuOpen = !telegramMenuOpen"
                class="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
                :class="{ 'bg-slate-200 dark:bg-slate-600': telegramMenuOpen }">
                <UIcon name="i-heroicons-ellipsis-vertical" class="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>

              <!-- Выпадающее меню - используем Teleport -->
              <Teleport to="body">
                <div v-if="telegramMenuOpen"
                  class="fixed bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-200 dark:border-slate-600 z-[9999] min-w-40"
                  :style="telegramMenuStyle" @click.stop>
                  <button @click="openTelegramConnectModal"
                    class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 w-full text-left cursor-pointer"
                    @click.stop="telegramMenuOpen = false">
                    <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                    Изменить
                  </button>
                  <button @click="disconnectTelegram"
                    class="flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 w-full text-left cursor-pointer"
                    @click.stop="telegramMenuOpen = false">
                    <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                    Отвязать
                  </button>
                </div>
              </Teleport>
            </div>
          </div>
        </li>

        <!-- Если не подключен - показываем кнопку подключить -->
        <li v-else class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40">
          <button @click="openTelegramConnectModal" class="flex items-center justify-between gap-2 w-full">
            <div class="flex items-center gap-2">
              <UIcon name="i-logos-telegram" class="w-5 h-5" />
              <div>
                <p class="text-slate-900 dark:text-white font-medium">
                  Подключить Telegram
                </p>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Подключите свой аккаунт для быстрого входа
                </p>
              </div>
            </div>
            <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </li>
      </ul>
    </div>

    <!-- Модальное окно для подключения Telegram -->
    <TelegramConnectModal v-model="showTelegramModal" :telegram-id="telegramId"
      @success="handleTelegramConnectSuccess" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Настройки профиля', layout: 'profile' })

const pending = ref(false)
const form = reactive<{ firstName: string; lastName: string; email: string; city: string; substation: string; avatarUrl: string; dateOfBirth: string }>({ firstName: '', lastName: '', email: '', city: '', substation: '', avatarUrl: '', dateOfBirth: '' })
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const rightBoxRef = ref<HTMLElement | null>(null)
const avatarBoxStyle = computed(() => {
  const el = rightBoxRef.value
  if (!el) return {}
  const h = el.getBoundingClientRect().height
  return { width: `${h}px` }
})
// Подстанции: загрузка и подготовка для UInputMenu
const optsFetch: any = { credentials: 'include' }
if (process.server) {
  const headers = useRequestHeaders(['cookie'])
  optsFetch.headers = { cookie: headers.cookie as string }
}
const { data: subsAll } = await useFetch<{ success: boolean; items: any[]; total: number }>(
  '/api/substations/all',
  optsFetch
)
const { data: subsIdx } = await useFetch<{ success: boolean; items: any[]; total: number }>(
  '/api/substations',
  optsFetch
)
const substationItems = computed(() => {
  const a: any[] = Array.isArray((subsAll.value as any)?.items) ? (subsAll.value as any).items : []
  const b: any[] = Array.isArray((subsIdx.value as any)?.items) ? (subsIdx.value as any).items : []
  const items = a.length ? a : b
  return items.map((s: any) => ({
    id: String(s._id || s.id || s.name || ''),
    // Показываем номер и регион, если возможно
    label: (() => {
      const name = s.name || s.title || ''
      const match = typeof name === 'string' ? name.match(/\d+/) : null
      const num = s.number ?? (match ? match[0] : '')
      const regionName = s.region?.name || ''
      const regionNumMatch = typeof regionName === 'string' ? regionName.match(/\d+/) : null
      const regionNum = regionNumMatch ? regionNumMatch[0] : ''
      if (num && regionNum) return `Подстанция №${num}, Регион №${regionNum}`
      if (num && regionName) return `Подстанция №${num}, ${regionName}`
      if (num) return `Подстанция №${num}`
      if (regionNum) return `Регион №${regionNum}`
      if (regionName) return `Регион ${regionName}`
      return name || 'Подстанция'
    })(),
    class: 'cursor-pointer'
  }))
})

// Для UInputMenu связываем объектом, но сохраняем id в форму
const selectedSubstation = computed({
  get: () => {
    return form.substation
  },
  set: (val: string) => {
    form.substation = val
  }
})
const pendingPwd = ref(false)
const pwd = reactive({ currentPassword: '', newPassword: '' })
const telegramMenuOpen = ref(false)
const telegramMenuRef = ref<HTMLElement | null>(null)
const telegramMenuStyle = ref({ top: '0px', left: '0px' })
const showTelegramModal = ref(false)
const telegramId = ref('')

// Функция для вычисления позиции меню
const getTelegramMenuStyle = () => {
  if (!telegramMenuRef.value) return { top: '0px', left: '0px' }

  const rect = telegramMenuRef.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 4}px`,
    left: `${rect.right - 160}px` // Выравниваем по правому краю
  }
}

// Следим за изменением открытия меню для обновления позиции
watch(telegramMenuOpen, () => {
  if (telegramMenuOpen.value && telegramMenuRef.value) {
    nextTick(() => {
      const style = getTelegramMenuStyle()
      telegramMenuStyle.value = style
    })
  }
})

// Индикатор силы пароля (Nuxt UI пример, адаптация)
const showNew = ref(false)
function checkStrength(str: string) {
  const requirements = [
    { regex: /.{8,}/, text: 'Не менее 8 символов' },
    { regex: /\d/, text: 'Минимум 1 цифра' },
    { regex: /[a-z]/, text: 'Минимум 1 строчная буква' },
    { regex: /[A-Z]/, text: 'Минимум 1 заглавная буква' }
  ]
  return requirements.map((req) => ({ met: req.regex.test(str), text: req.text }))
}
const pwdStrength = computed(() => checkStrength(pwd.newPassword))
const pwdScore = computed(() => pwdStrength.value.filter((r) => r.met).length)
const pwdStrengthColor = computed(() => {
  if (pwdScore.value === 0) return 'neutral'
  if (pwdScore.value <= 1) return 'error'
  if (pwdScore.value <= 2) return 'warning'
  if (pwdScore.value === 3) return 'warning'
  return 'success'
})
const pwdStrengthText = computed(() => {
  if (pwdScore.value === 0) return 'Введите пароль'
  if (pwdScore.value <= 2) return 'Слабый пароль'
  if (pwdScore.value === 3) return 'Средний пароль'
  return 'Надёжный пароль'
})

// Подгружаем текущего пользователя
const opts: any = { credentials: 'include' }
if (process.server) {
  const headers = useRequestHeaders(['cookie'])
  opts.headers = { cookie: headers.cookie as string }
}
const { data } = await useFetch<{ success: boolean; user: any }>('/api/auth/me', opts)
const user = computed(() => (data.value as any)?.user)

// Текущий пользователь из data
const currentUser = computed(() => (data.value as any)?.user)

// Проверяем, есть ли уже сохраненная дата рождения
const hasSavedDateOfBirth = computed(() => {
  const u: any = data.value?.user
  return !!(u?.dateOfBirth)
})

// Функция для открытия модального окна подключения Telegram
const openTelegramConnectModal = () => {
  telegramMenuOpen.value = false

  if (!currentUser.value?.id && !currentUser.value?._id) {
    console.error('❌ Не найден ID пользователя')
    return
  }

  // Открываем бота в новой вкладке
  const config = useRuntimeConfig()
  const userId = currentUser.value._id || currentUser.value.id
  const botUsername = config.public.telegramBotUsername || 'helpssmp_bot'
  const botUrl = `https://t.me/${botUsername}?start=connect_${userId}`

  window.open(botUrl, '_blank')

  // Открываем модальное окно через небольшую задержку
  setTimeout(() => {
    showTelegramModal.value = true
  }, 500)
}

// Обработчик успешного подключения
const handleTelegramConnectSuccess = async () => {
  // @ts-ignore
  const toast = useToast?.()
  toast?.add?.({ title: 'Telegram успешно подключен!', color: 'success' })

  // Обновляем данные пользователя
  await refresh()
}

// Проверяем, подключен ли Telegram
const isTelegramConnected = computed(() => {
  return !!(currentUser.value?.telegram?.id)
})

watchEffect(() => {
  const u: any = data.value?.user
  if (u) {
    form.firstName = u.firstName || ''
    form.lastName = u.lastName || ''
    form.email = u.email || ''
    form.city = u.city || ''
    form.substation = (typeof u.substation === 'string' ? u.substation : String(u.substation || ''))
    form.avatarUrl = u.avatarUrl || ''
    form.dateOfBirth = u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().substring(0, 10) : ''
  }
})

function resetForm() {
  const u: any = data.value?.user
  if (u) {
    form.firstName = u.firstName || ''
    form.lastName = u.lastName || ''
    form.email = u.email || ''
    form.city = u.city || ''
    form.substation = (typeof u.substation === 'string' ? u.substation : String(u.substation || ''))
    form.avatarUrl = u.avatarUrl || ''
    form.dateOfBirth = u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().substring(0, 10) : ''
  }
}

async function onSubmit() {
  pending.value = true
  try {
    // Создаем копию формы для отправки, исключая dateOfBirth если оно уже было сохранено
    const body: any = { ...form }
    if (hasSavedDateOfBirth.value) {
      delete body.dateOfBirth
    }
    const res: any = await $fetch('/api/auth/update', { method: 'PUT', body })
    if (res?.success && res.user) {
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Профиль сохранён', color: 'neutral' })
      // Обновляем глобального пользователя для реактивного обновления шапки
      const { user: authUser } = useAuth()
      authUser.value = res.user
      // Обновляем локальные данные пользователя
      if (data.value) {
        data.value.user = res.user
      }
      // Обновляем форму из ответа, чтобы убедиться, что дата корректно отображается
      if (res.user.dateOfBirth) {
        form.dateOfBirth = new Date(res.user.dateOfBirth).toISOString().substring(0, 10)
      } else {
        form.dateOfBirth = ''
      }
      if (process.client) {
        window.dispatchEvent(new Event('auth-updated'))
      }
    }
  } finally {
    pending.value = false
  }
}

function openFilePicker() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  await uploadAvatarFile(input.files[0])
  input.value = ''
}

function onDragOver() { isDragging.value = true }
function onDragLeave() { isDragging.value = false }
async function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (!files || !files[0]) return
  await uploadAvatarFile(files[0])
}

async function uploadAvatarFile(file: File) {
  const formData = new FormData()
  formData.append('file', file, file.name)
  try {
    const res: any = await $fetch('/api/upload/avatar', {
      method: 'POST',
      body: formData
    })
    if (res?.success && res.url) {
      form.avatarUrl = res.url
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Аватар загружен', color: 'success' })
      // Сохраняем профиль сразу, чтобы значение не терялось после обновления
      await onSubmit()
    }
  } catch (err) {
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось загрузить файл', color: 'error' })
  }
}

const clearAvatar = async () => {
  form.avatarUrl = ''
  await onSubmit()
}

async function onChangePassword() {
  pendingPwd.value = true
  try {
    if (!pwd.currentPassword || !pwd.newPassword) return
    const res: any = await $fetch('/api/auth/change-password', { method: 'PUT', body: pwd })
    // @ts-ignore
    const toast = useToast?.()
    if (res?.success) {
      toast?.add?.({ title: 'Пароль обновлён', color: 'neutral' })
      pwd.currentPassword = ''
      pwd.newPassword = ''
    } else {
      toast?.add?.({ title: res?.message || 'Не удалось обновить пароль', color: 'error' })
    }
  } finally {
    pendingPwd.value = false
  }
}

async function disconnectTelegram() {
  try {
    const res: any = await $fetch('/api/auth/disconnect-telegram', { method: 'POST' })
    // @ts-ignore
    const toast = useToast?.()
    if (res?.success) {
      toast?.add?.({ title: 'Telegram отключен', color: 'neutral' })
      // Закрываем меню
      telegramMenuOpen.value = false
      // Перезагружаем данные пользователя
      await refresh()
    } else {
      toast?.add?.({ title: res?.message || 'Не удалось отключить Telegram', color: 'error' })
    }
  } catch (error) {
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Ошибка при отключении Telegram', color: 'error' })
  }
}

// Проверяем параметры URL для подключения Telegram
const route = useRoute()

const { refresh } = useFetch('/api/auth/me', opts)

// Слушаем изменения data и обновляем currentUser
const userData = computed(() => data.value?.user)

onMounted(async () => {
  // Закрываем меню при клике вне его
  document.addEventListener('click', (e) => {
    if (!telegramMenuRef.value?.contains(e.target as Node)) {
      telegramMenuOpen.value = false
    }
  })

  if (route.query.telegram_connected === 'true') {
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Telegram успешно подключен!', color: 'success' })

    // Обновляем данные пользователя
    await refresh()

    // Убираем параметр из URL
    navigateTo('/profile/settings', { replace: true })
  }
})
</script>
