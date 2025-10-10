<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 md:rounded-lg overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-300">Настройки профиля</p>
      </div>
      <div class="p-4 sm:p-6">
        <UForm :state="form" @submit.prevent="onSubmit" class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UFormField label="Имя" required>
              <UInput v-model="form.firstName" placeholder="Ваше имя" class="w-full" size="xl" :input-class="'px-4 py-3'" />
            </UFormField>
            <UFormField label="Фамилия" required>
              <UInput v-model="form.lastName" placeholder="Ваша фамилия" class="w-full" size="xl" :input-class="'px-4 py-3'" />
            </UFormField>
          </div>
          <UFormField label="Email" required>
            <UInput v-model="form.email" placeholder="you@example.com" type="email" class="w-full" size="xl" :input-class="'px-4 py-3'" />
          </UFormField>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UFormField label="Город работы">
              <UInput v-model="form.city" placeholder="Город" class="w-full" size="xl" :input-class="'px-4 py-3'" />
            </UFormField>
            <UFormField label="Подстанция">
              <UInput v-model="form.substation" placeholder="Например: 5-я подстанция" class="w-full" size="xl" :input-class="'px-4 py-3'" />
            </UFormField>
          </div>
          <div class="flex items-center justify-end gap-2">
            <UButton color="neutral" variant="ghost" type="button" @click="resetForm" class="cursor-pointer">Сбросить</UButton>
            <UButton color="primary" :loading="pending" class="cursor-pointer" @click="onSubmit">Сохранить</UButton>
          </div>
        </UForm>
      </div>
    </div>

    <!-- Смена пароля -->
    <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 md:rounded-lg overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-300">Смена пароля</p>
      </div>
      <div class="p-4 sm:p-6">
        <UForm :state="pwd" @submit.prevent="onChangePassword" class="space-y-4">
          <UFormField label="Текущий пароль" required>
            <UInput v-model="pwd.currentPassword" type="password" placeholder="••••••" class="w-full" size="lg" :input-class="'px-4 py-3'" />
          </UFormField>
          <div class="space-y-2">
            <UFormField label="Новый пароль" required>
              <UInput
                v-model="pwd.newPassword"
                :type="showNew ? 'text' : 'password'"
                placeholder="Новый пароль"
                class="w-full"
                size="lg"
                :color="pwdStrengthColor"
                :aria-invalid="pwdScore < 4"
                aria-describedby="password-strength"
                :ui="{ trailing: 'pe-1' }"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="showNew ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :aria-label="showNew ? 'Скрыть пароль' : 'Показать пароль'"
                    :aria-pressed="showNew"
                    aria-controls="password"
                    @click="showNew = !showNew"
                  />
                </template>
              </UInput>
            </UFormField>

            <UProgress :color="pwdStrengthColor" :indicator="pwdStrengthText" :model-value="pwdScore" :max="4" size="sm" />

            <p id="password-strength" class="text-sm font-medium">
              {{ pwdStrengthText }}. Должен содержать:
            </p>
            <ul class="space-y-1" aria-label="Требования к паролю">
              <li v-for="(req, idx) in pwdStrength" :key="idx" class="flex items-center gap-1" :class="req.met ? 'text-success' : 'text-muted'">
                <UIcon :name="req.met ? 'i-lucide-circle-check' : 'i-lucide-circle-x'" class="size-4 shrink-0" />
                <span class="text-xs">{{ req.text }}</span>
              </li>
            </ul>
          </div>
          <div class="flex items-center justify-end gap-2">
            <UButton color="primary" :loading="pendingPwd" class="cursor-pointer" @click="onChangePassword">Обновить пароль</UButton>
          </div>
        </UForm>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Настройки профиля', layout: 'profile' })

const pending = ref(false)
const form = reactive({ firstName: '', lastName: '', email: '', city: '', substation: '' })
const pendingPwd = ref(false)
const pwd = reactive({ currentPassword: '', newPassword: '' })

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
const { data } = await useFetch('/api/auth/me', opts)
watchEffect(() => {
  const u: any = data.value?.user
  if (u) {
    form.firstName = u.firstName || ''
    form.lastName = u.lastName || ''
    form.email = u.email || ''
    form.city = u.city || ''
    form.substation = u.substation || ''
  }
})

function resetForm() {
  const u: any = data.value?.user
  if (u) {
    form.firstName = u.firstName || ''
    form.lastName = u.lastName || ''
    form.email = u.email || ''
    form.city = u.city || ''
    form.substation = u.substation || ''
  }
}

async function onSubmit() {
  pending.value = true
  try {
    const res: any = await $fetch('/api/auth/update', { method: 'PUT', body: form })
    if (res?.success) {
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Профиль сохранён', color: 'neutral' })
    }
  } finally {
    pending.value = false
  }
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
</script>
