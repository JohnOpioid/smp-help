import { bot } from '~/server/telegram/bot'

export default defineNitroPlugin(async (nitroApp) => {
  if (bot) {
    const siteUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
    console.log('🔍 Telegram Bot Configuration:')
    console.log('  NUXT_PUBLIC_APP_URL:', process.env.NUXT_PUBLIC_APP_URL)
    console.log('  NUXT_PUBLIC_SITE_URL:', process.env.NUXT_PUBLIC_SITE_URL)
    console.log('  Selected URL:', siteUrl)
    console.log('  Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? `${process.env.TELEGRAM_BOT_TOKEN.substring(0, 10)}...` : 'NOT SET')
    console.log('  NODE_ENV:', process.env.NODE_ENV)
    
    if (!siteUrl) {
      console.error('❌ NUXT_PUBLIC_APP_URL не установлена, бот не будет работать с webhook')
      console.error('   Установите переменную окружения NUXT_PUBLIC_APP_URL')
      console.error('   Или используйте polling для локальной разработки')
      
      // Для локальной разработки без URL используем polling
      try {
        // Проверяем, не запущен ли уже polling
        if (bot.isPolling?.()) {
          console.log('⏭️ Polling уже запущен, пропускаем повторную инициализацию')
          return
        }
        
        const webhookInfo = await bot.getWebHookInfo()
        console.log('  Текущий webhook:', webhookInfo.url)
        
        if (webhookInfo.url) {
          await bot.deleteWebHook()
          console.log('  ✅ Webhook удален для локальной разработки')
        }
        
        bot.startPolling({
          interval: 300,
          params: {
            allowed_updates: ['message', 'callback_query']
          }
        })
        console.log('✅ Telegram бот работает в режиме polling (без URL)')
      } catch (error) {
        console.error('❌ Ошибка запуска polling:', error)
      }
      return
    }
    const isHttps = siteUrl.startsWith('https://')
    
    // Проверяем порт (Telegram webhook работает только на портах 80, 88, 443, 8443)
    const url = new URL(siteUrl)
    const allowedPorts = ['80', '88', '443', '8443', '']
    const isAllowedPort = allowedPorts.includes(url.port)
    
    if (isHttps && isAllowedPort) {
      // Для HTTPS на правильном порту используем webhook
      const webhookUrl = `${siteUrl}/api/telegram/webhook`
      
      console.log('🔧 Установка webhook для HTTPS')
      console.log('  Webhook URL:', webhookUrl)
      
      try {
        // Проверяем текущий webhook
        const webhookInfo = await bot.getWebHookInfo()
        console.log('  Текущий webhook:', webhookInfo.url)
        
        // Удаляем webhook если был установлен ранее
        await bot.deleteWebHook()
        console.log('  ✅ Старый webhook удален')
        
        // Устанавливаем новый webhook
        await bot.setWebHook(webhookUrl)
        console.log('✅ Telegram bot webhook установлен:', webhookUrl)
        
        // Останавливаем polling если был запущен
        if (bot.isPolling?.()) {
          await bot.stopPolling()
          console.log('  ✅ Polling остановлен')
        }
      } catch (error) {
        console.error('❌ Ошибка установки webhook:', error)
      }
    } else {
      // Для HTTP или неподходящего порта используем polling
      console.log('🔧 Использование polling для HTTP/dev')
      
      try {
        // Проверяем что webhook не установлен
        const webhookInfo = await bot.getWebHookInfo()
        console.log('  Текущий webhook:', webhookInfo.url)
        
        if (webhookInfo.url) {
          // Если webhook установлен, удаляем его
          await bot.deleteWebHook()
          console.log('  ✅ Webhook удален для локальной разработки')
        }
        
        // Проверяем, не запущен ли уже polling
        if (!bot.isPolling?.()) {
          // Запускаем polling
          bot.startPolling({
            interval: 300,
            params: {
              allowed_updates: ['message', 'callback_query']
            }
          })
          console.log('✅ Telegram бот работает в режиме polling (HTTP или dev порт)')
        } else {
          console.log('⏭️ Polling уже запущен, пропускаем повторную инициализацию')
        }
      } catch (error) {
        console.error('❌ Ошибка запуска polling:', error)
      }
    }
  }
})

