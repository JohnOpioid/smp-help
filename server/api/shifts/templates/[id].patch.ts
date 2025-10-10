import { defineEventHandler, getCookie, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import jwt from 'jsonwebtoken'
import ShiftTemplate from '~/server/models/ShiftTemplate'

export default defineEventHandler(async (event) => {
  await connectDB()
  const token = getCookie(event, 'token')
  if (!token) return { success: false, message: 'Токен не найден' }
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string }
    const params = event.context.params as { id?: string }
    const id = params?.id
    const body = await readBody(event)
    if (!id) return { success: false, message: 'Не указан идентификатор' }
    const update: any = {}
    if (typeof body?.title === 'string') update.title = body.title
    if (typeof body?.startTime === 'string') update.startTime = body.startTime
    if (typeof body?.endTime === 'string') update.endTime = body.endTime
    if (typeof body?.color === 'string') update.color = body.color
    const doc = await ShiftTemplate.findOneAndUpdate({ _id: id, userId: decoded.userId }, update, { new: true })
    if (!doc) return { success: false, message: 'Шаблон не найден' }
    return { success: true, item: doc }
  } catch {
    return { success: false, message: 'Ошибка обновления шаблона' }
  }
})


