export const useIsMobile = () => {
  const isMobile = ref(false)
  
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 640 // sm breakpoint
  }
  
  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })
  
  onBeforeUnmount(() => {
    window.removeEventListener('resize', checkMobile)
  })
  
  return { isMobile }
}
