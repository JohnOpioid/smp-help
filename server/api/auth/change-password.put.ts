import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import { requireUser } from '~/server/utils/auth'
import User from '~/server/models/User'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  await connectDB()
  const sessionUser: any = await requireUser(event)
  const body = await readBody(event)
  const { currentPassword, newPassword } = body || {}
  if (!currentPassword || !newPassword) {
    return { success: false, message: 'Заполните текущий и новый пароль' }
  }

  const user = await User.findById(sessionUser._id)
  if (!user) return { success: false, message: 'Пользователь не найден' }

  const ok = await user.comparePassword(currentPassword)
  if (!ok) return { success: false, message: 'Текущий пароль неверен' }

  user.password = newPassword
  await user.save()
  return { success: true }
})


