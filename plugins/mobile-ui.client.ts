// plugins/mobile-ui.client.ts
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(async () => {
  if (process.client && Capacitor.isNativePlatform()) {
    try {
      // Настраиваем статус-бар
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#3b82f6' })
      await StatusBar.setOverlaysWebView({ overlay: true })
      
      // Получаем высоту статус-бара
      const statusBarHeight = await StatusBar.getInfo()
      
      // Добавляем CSS переменную для высоты статус-бара
      document.documentElement.style.setProperty('--status-bar-height', `${statusBarHeight.height}px`)
      
      // Устанавливаем padding-top для body, чтобы контент не заходил под статус-бар
      document.body.style.paddingTop = `${statusBarHeight.height}px`
      
      // Оптимизация производительности
      document.documentElement.style.setProperty('--webkit-transform', 'translateZ(0)')
      document.documentElement.style.setProperty('--webkit-backface-visibility', 'hidden')
      
      // Предотвращаем зум при двойном тапе
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        )
      }
      
      console.log('📱 Mobile UI настроен:', {
        statusBarHeight: statusBarHeight.height,
        style: statusBarHeight.style
      })
    } catch (error) {
      console.error('Ошибка настройки мобильного UI:', error)
    }
  }
})
