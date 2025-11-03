export type WebShareData = {
  title?: string
  text?: string
  url?: string
}

export const useWebShare = () => {
  const isSupported = process.client && typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function'

  const share = async (data: WebShareData = {}) => {
    if (!isSupported) {
      return { success: false, error: 'Web Share API не поддерживается' }
    }
    try {
      const shareData: any = { title: data.title || '', text: data.text || '', url: data.url || '' }
      for (const k of Object.keys(shareData)) {
        if (!shareData[k]) delete shareData[k]
      }
      // @ts-ignore
      await navigator.share(shareData)
      return { success: true }
    } catch (error: any) {
      if (error?.name === 'AbortError') return { success: false, error: 'Пользователь отменил' }
      return { success: false, error: error?.message || 'Ошибка шаринга' }
    }
  }

  const shareFiles = async (files: File[] = [], data: WebShareData = {}) => {
    if (!isSupported || typeof (navigator as any).canShare !== 'function') {
      return { success: false, error: 'Шаринг файлов не поддерживается' }
    }
    try {
      const payload: any = { title: data.title || '', text: data.text || '', files }
      // @ts-ignore
      if (typeof navigator.canShare === 'function' && !navigator.canShare(payload)) {
        return { success: false, error: 'Данные не могут быть расшарены' }
      }
      // @ts-ignore
      await navigator.share(payload)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || 'Ошибка шаринга файлов' }
    }
  }

  return { isSupported, share, shareFiles }
}
