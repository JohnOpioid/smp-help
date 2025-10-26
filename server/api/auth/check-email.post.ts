import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'

export default defineEventHandler(async (event) => {
  await connectDB()

  try {
    const body = await readBody(event)
    const { email } = body || {}
    
    if (!email || !email.trim()) {
      return { exists: false }
    }

    // Проверяем email на корректность
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return { exists: false }
    }

    // Находим пользователя
    const user = await User.findOne({ email: email.trim().toLowerCase() })
    
    return { exists: !!user }
  } catch (error) {
    console.error('❌ Error checking email:', error)
    return { exists: false }
  }
})

