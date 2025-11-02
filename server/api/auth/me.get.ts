import { defineEventHandler, setHeader, getMethod } from 'h3'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // Обрабатываем preflight запросы
  if (getMethod(event) === 'OPTIONS') {
    return new Response(null, { status: 200 })
  }

  const user: any = await requireUser(event)
  return {
    success: true,
    user: {
      _id: user._id,
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      city: user.city || '',
      substation: user.substation || '',
      avatarUrl: user.avatarUrl || '',
      dateOfBirth: user.dateOfBirth || undefined,
      role: user.role,
      telegram: user.telegram || undefined
    }
  }
})


