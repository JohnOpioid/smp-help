export const useTheme = () => {
  const isDark = ref(false)
  const isInitialized = ref(false)

  // Инициализация темы с localStorage
  const initTheme = () => {
    if (process.client && !isInitialized.value) {
      // Проверяем сохраненную тему в localStorage
      const savedTheme = localStorage.getItem('theme')
      
      if (savedTheme === 'dark' || savedTheme === 'light') {
        isDark.value = savedTheme === 'dark'
      } else {
        // Если нет сохраненной темы, используем системную
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        isDark.value = prefersDark
        // Сохраняем системную тему
        localStorage.setItem('theme', prefersDark ? 'dark' : 'light')
      }
      
      updateTheme()
      isInitialized.value = true
    }
  }

  // Переключение темы
  const toggleTheme = () => {
    isDark.value = !isDark.value
    updateTheme()
    
    // Сохраняем выбор пользователя
    if (process.client) {
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }
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
