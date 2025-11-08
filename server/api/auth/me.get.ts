import { defineEventHandler, setHeader, getMethod } from 'h3'
import { requireUser } from '~/server/utils/auth'
import User from '~/server/models/User'
import connectDB from '~/server/utils/mongodb'

export default defineEventHandler(async (event) => {
  // Обрабатываем preflight запросы
  if (getMethod(event) === 'OPTIONS') {
    return new Response(null, { status: 200 })
  }

  await connectDB()
  const user: any = await requireUser(event)
  
  // Обновляем lastVisit при каждом запросе (но не чаще раза в день для оптимизации)
  const now = new Date()
  const lastVisit = user.lastVisit ? new Date(user.lastVisit) : null
  
  // Проверяем, был ли сегодня уже обновлен lastVisit
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastVisitDate = lastVisit ? new Date(lastVisit) : null
  lastVisitDate?.setHours(0, 0, 0, 0)
  
  // Обновляем lastVisit только если сегодня еще не обновляли
  if (!lastVisit || !lastVisitDate || lastVisitDate.getTime() < today.getTime()) {
    await User.findByIdAndUpdate(user._id, { 
      lastVisit: now 
    }).then(() => {
      console.log(`✅ Обновлен lastVisit для пользователя ${user._id} на ${now.toISOString()}`)
    }).catch((err) => {
      console.error('Ошибка обновления lastVisit в /api/auth/me:', err)
    })
  }
  
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


