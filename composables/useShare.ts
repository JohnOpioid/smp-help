export type SharePayload = {
  url?: string
  title?: string
  description?: string
}

function openShareWindow(url: string) {
  try {
    window.open(url, '_blank', 'width=600,height=400,menubar=no,toolbar=no,location=no')
  } catch {
    window.open(url, '_blank')
  }
}

export const useShare = () => {
  const shareToTelegram = (payload: SharePayload) => {
    // Для Telegram: если description уже содержит полный текст (включая ссылку), используем его
    // Иначе формируем из title + description + url
    const fullText = payload.description || `${payload.title || ''}${payload.url ? `\n\n${payload.url}` : ''}`.trim()
    const text = encodeURIComponent(fullText)
    const url = encodeURIComponent(payload.url || '')
    const shareUrl = `https://t.me/share/url?url=${url}&text=${text}`
    openShareWindow(shareUrl)
  }

  const shareToWhatsApp = (payload: SharePayload) => {
    // Для WhatsApp: если description уже содержит полный текст (включая ссылку), используем его
    // Иначе формируем из title + description + url
    const fullText = payload.description || `${payload.title || ''}${payload.url ? `\n\n${payload.url}` : ''}`.trim()
    const text = encodeURIComponent(fullText)
    const shareUrl = `https://wa.me/?text=${text}`
    openShareWindow(shareUrl)
  }

  const shareNative = async (payload: SharePayload & { files?: File[] }) => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        // @ts-ignore
        await navigator.share({ title: payload.title, text: payload.description, url: payload.url, files: payload.files })
      } catch (_) {}
    }
  }

  return {
    shareToTelegram,
    shareToWhatsApp,
    shareNative
  }
}
