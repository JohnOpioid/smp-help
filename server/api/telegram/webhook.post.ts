import { readBody, getMethod, createError } from 'h3'
import { bot } from '~/server/telegram/bot'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    
    // Обрабатываем обновление от Telegram
    if (bot) {
      await bot.processUpdate(body)
    }
    
    return { ok: true }
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return { ok: false, error: 'Webhook processing failed' }
  }
})

