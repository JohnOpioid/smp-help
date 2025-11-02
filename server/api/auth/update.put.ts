import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await connectDB()
  const sessionUser: any = await requireUser(event)
  const body = await readBody(event)
  const update: any = {}
  if (typeof body?.firstName === 'string') update.firstName = body.firstName.trim()
  if (typeof body?.lastName === 'string') update.lastName = body.lastName.trim()
  if (typeof body?.email === 'string') update.email = body.email.trim().toLowerCase()
  if (typeof body?.city === 'string') update.city = body.city.trim()
  if (typeof body?.substation === 'string') update.substation = body.substation.trim()
  if (typeof body?.avatarUrl === 'string') update.avatarUrl = body.avatarUrl.trim()
  if ('dateOfBirth' in body) {
    if (body.dateOfBirth && typeof body.dateOfBirth === 'string' && body.dateOfBirth.trim() !== '') {
      const date = new Date(body.dateOfBirth)
      if (!isNaN(date.getTime())) {
        update.dateOfBirth = date
      }
    } else {
      update.dateOfBirth = null
    }
  }

  const user = await User.findByIdAndUpdate(sessionUser._id, update, { new: true }).select('-password').lean()
  
  // Убеждаемся, что dateOfBirth включен в ответ
  return {
    success: true,
    user: {
      ...user,
      dateOfBirth: user.dateOfBirth || undefined
    }
  }
})


