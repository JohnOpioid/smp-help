import { ref } from 'vue'

// Глобальное состояние попапа Амби
const userDismissed = ref(false)

export const useAmbiPopup = () => {
  return {
    userDismissed
  }
}
