import { bot } from '~/server/telegram/bot'

export default defineNitroPlugin(async () => {
  if (!process.env.TELEGRAM_BOT_TOKEN && process.env.NODE_ENV !== 'production') {
    console.log('⚠️ TELEGRAM_BOT_TOKEN не установлен, Telegram бот не будет работать')
    return
  }

  if (!bot) return

  console.log('🔍 Telegram Bot (Telegraf) Configuration:')
  console.log('  NUXT_PUBLIC_APP_URL:', process.env.NUXT_PUBLIC_APP_URL)
  console.log('  NUXT_PUBLIC_SITE_URL:', process.env.NUXT_PUBLIC_SITE_URL)
  console.log('  NODE_ENV:', process.env.NODE_ENV)

  try {
    // Для простоты и надежности используем polling в любых средах,
    // так как webhook-роута в проекте нет.
    await bot.launch()
    console.log('✅ Telegram бот запущен (polling)')
  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error)
  }
})

