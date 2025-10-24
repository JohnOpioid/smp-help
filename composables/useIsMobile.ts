export const useIsMobile = () => {
  const isMobile = ref(false)
  
  if (process.client) {
    // Простая проверка размера экрана без resize listener
    isMobile.value = window.innerWidth < 640 // sm breakpoint
  }
  
  return { isMobile }
}
