import { bot } from '~/server/telegram/bot'

export default defineNitroPlugin(async (nitroApp) => {
  if (bot) {
    const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://192.168.1.40:3000'
    const isHttps = siteUrl.startsWith('https://')
    
    // Проверяем порт (Telegram webhook работает только на портах 80, 88, 443, 8443)
    const url = new URL(siteUrl)
    const allowedPorts = ['80', '88', '443', '8443', '']
    const isAllowedPort = allowedPorts.includes(url.port)
    
    if (isHttps && isAllowedPort) {
      // Для HTTPS на правильном порту используем webhook
      const webhookUrl = `${siteUrl}/api/telegram/webhook`
      
      try {
        await bot.setWebHook(webhookUrl)
        console.log('✅ Telegram bot webhook установлен:', webhookUrl)
      } catch (error) {
        console.error('❌ Ошибка установки webhook:', error)
      }
    } else {
      // Для HTTP или неподходящего порта используем polling
      console.log('✅ Telegram бот работает в режиме polling (HTTP или dev порт)')
    }
  }
})

