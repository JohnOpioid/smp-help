import { bot } from '~/server/telegram/bot'

export default defineNitroPlugin(async (nitroApp) => {
  if (bot) {
    const siteUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru'
    const isHttps = siteUrl.startsWith('https://')
    
    // Проверяем порт (Telegram webhook работает только на портах 80, 88, 443, 8443)
    const url = new URL(siteUrl)
    const allowedPorts = ['80', '88', '443', '8443', '']
    const isAllowedPort = allowedPorts.includes(url.port)
    
    if (isHttps && isAllowedPort) {
      // Для HTTPS на правильном порту используем webhook
      const webhookUrl = `${siteUrl}/api/telegram/webhook`
      
      try {
        // Сначала удаляем webhook если был установлен ранее
        await bot.deleteWebHook()
        
        // Устанавливаем новый webhook
        await bot.setWebHook(webhookUrl)
        console.log('✅ Telegram bot webhook установлен:', webhookUrl)
        
        // Останавливаем polling если был запущен
        if (bot.isPolling?.()) {
          await bot.stopPolling()
          console.log('✅ Polling остановлен')
        }
      } catch (error) {
        console.error('❌ Ошибка установки webhook:', error)
      }
    } else {
      // Для HTTP или неподходящего порта используем polling
      try {
        // Проверяем что webhook не установлен
        const webhookInfo = await bot.getWebHookInfo()
        if (webhookInfo.url) {
          // Если webhook установлен, удаляем его
          await bot.deleteWebHook()
          console.log('✅ Webhook удален для локальной разработки')
        }
        
        // Запускаем polling
        bot.startPolling({
          interval: 300,
          params: {
            allowed_updates: ['message', 'callback_query']
          }
        })
        console.log('✅ Telegram бот работает в режиме polling (HTTP или dev порт)')
      } catch (error) {
        console.error('❌ Ошибка запуска polling:', error)
      }
    }
  }
})

