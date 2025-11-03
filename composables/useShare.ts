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
    const text = encodeURIComponent(`${payload.title || ''}\n\n${payload.description || ''}`.trim())
    const url = encodeURIComponent(payload.url || '')
    const shareUrl = `https://t.me/share/url?url=${url}&text=${text}`
    openShareWindow(shareUrl)
  }

  const shareToWhatsApp = (payload: SharePayload) => {
    const text = encodeURIComponent(`${payload.title || ''}\n\n${payload.description || ''}\n\n${payload.url || ''}`.trim())
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
