export const useTheme = () => {
  const isDark = ref(false)
  const isInitialized = ref(false)

  // Инициализация темы (без localStorage)
  const initTheme = () => {
    if (process.client && !isInitialized.value) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = prefersDark
      updateTheme()
      isInitialized.value = true
    }
  }

  // Переключение темы
  const toggleTheme = () => {
    isDark.value = !isDark.value
    updateTheme()
  }

  // Обновление темы
  const updateTheme = () => {
    if (process.client) {
      if (isDark.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  // Инициализация при монтировании
  onMounted(() => {
    initTheme()
  })

  return {
    isDark: readonly(isDark),
    toggleTheme,
    initTheme
  }
}
