import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.smp.help',
  appName: 'Помощник СМП',
  webDir: '.output/public',
  server: {
    androidScheme: 'https',
    url: 'https://helpsmp.ru'
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#3b82f6',
      overlaysWebView: true // Изменяем на true, чтобы контент не заходил под статус-бар
    },
    WebView: {
      // Оптимизация производительности WebView
      android: {
        hardwareAcceleration: true,
        mixedContentMode: 'MIXED_CONTENT_ALWAYS_ALLOW'
      }
    }
  },
  // Оптимизация сборки
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
