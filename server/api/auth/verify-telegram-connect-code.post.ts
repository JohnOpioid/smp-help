import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { createError, getMethod, readBody, getCookie } from 'h3'

// Хранилище кодов для подключения (временное)
const connectCodes = new Map<string, { telegramId: string, expiresAt: number }>()

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    })
  }

  try {
    await connectDB()
    
    const body = await readBody(event)
    const { code } = body
    
    if (!code || code.length !== 6) {
      throw createError({
        statusCode: 400,
        message: 'Неверный код'
      })
    }
    
    // Находим код в хранилище
    const codeData = connectCodes.get(code)
    
    if (!codeData) {
      throw createError({
        statusCode: 404,
        message: 'Код не найден'
      })
    }
    
    // Проверяем срок действия (10 минут)
    if (Date.now() > codeData.expiresAt) {
      connectCodes.delete(code)
      throw createError({
        statusCode: 410,
        message: 'Срок действия кода истёк'
      })
    }
    
    // Получаем текущего пользователя из сессии
    const token = getCookie(event, 'token')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Необходимо войти в систему'
      })
    }
    
    const jwt = await import('jsonwebtoken')
    const config = useRuntimeConfig()
    
    let userId: any
    try {
      const decoded: any = jwt.default.verify(token, config.jwtSecret)
      userId = decoded.userId
    } catch (err) {
      throw createError({
        statusCode: 401,
        message: 'Недействительная сессия'
      })
    }
    
    // Находим пользователя
    const user = await User.findById(userId)
    
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      })
    }
    
    // Проверяем, не подключен ли уже этот Telegram к другому аккаунту
    const existingUser = await User.findOne({ 'telegram.id': codeData.telegramId })
    
    // Если Telegram привязан к другому аккаунту, отключаем его
    if (existingUser && existingUser._id.toString() !== userId) {
      console.log(`🔗 Telegram ${codeData.telegramId} уже привязан к другому аккаунту, отключаем...`)
      existingUser.telegram = undefined
      await existingUser.save()
    }
    
    // Подключаем Telegram к текущему аккаунту
    user.telegram = {
      id: codeData.telegramId,
      username: '', // Будет заполнено позже
      photo_url: '',
      auth_date: Date.now()
    }
    
    await user.save()
    
    console.log(`✅ Telegram ${codeData.telegramId} подключен к пользователю ${userId}`)
    
    // Удаляем использованный код
    connectCodes.delete(code)
    
    return {
      success: true,
      message: 'Telegram успешно подключен'
    }

  } catch (error: any) {
    console.error('Verify connect code error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при проверке кода'
    })
  }
})

// Экспортируем функцию для добавления кода (будет использоваться в боте)
export const addConnectCode = (code: string, telegramId: string) => {
  if (!telegramId) {
    console.error('❌ Telegram ID не указан')
    return
  }
  
  connectCodes.set(code, {
    telegramId,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 минут
  })
  
  // Очищаем старые коды
  setTimeout(() => {
    connectCodes.delete(code)
  }, 10 * 60 * 1000)
}
