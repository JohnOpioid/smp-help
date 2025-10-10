import { defineEventHandler, readBody, createError } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'

export default defineEventHandler(async (event) => {
  await connectDB()
  const config = useRuntimeConfig()
  const { email, token } = await readBody(event)

  if (token !== config.adminSetupToken) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Неверный токен' })
  }
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Укажите email' })
  }

  const user = await User.findOne({ email })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Пользователь не найден' })
  }

  user.role = 'admin'
  await user.save()

  return { success: true, message: 'Пользователь назначен администратором' }
})


