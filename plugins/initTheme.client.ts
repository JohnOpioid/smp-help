export default defineNuxtPlugin(() => {
  if (process.client) {
    // Проверяем сохраненную тему в localStorage
    const savedTheme = localStorage.getItem('theme')
    const root = document.documentElement
    
    if (savedTheme === 'dark' || savedTheme === 'light') {
      // Используем сохраненную тему
      if (savedTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } else {
      // Если нет сохраненной темы, используем системную
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        root.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    }
  }
})


