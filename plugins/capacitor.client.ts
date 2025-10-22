import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { Network } from '@capacitor/network'

export default defineNuxtPlugin(async () => {
  if (!process.client) return

  // Инициализация Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      // Настройка статус-бара
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#3b82f6' })

      // Обработка событий приложения
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive)
      })

      // Обработка событий сети
      Network.addListener('networkStatusChange', status => {
        console.log('Network status changed', status)
        // Можно интегрировать с useNetworkStatus
      })

      console.log('Capacitor plugins initialized')
    } catch (error) {
      console.warn('Capacitor initialization error:', error)
    }
  }

  return {
    provide: {
      capacitor: {
        isNative: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform()
      }
    }
  }
})

