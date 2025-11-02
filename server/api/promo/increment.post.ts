import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoProgress from '~/server/models/PromoProgress'
import PromoEvent from '~/server/models/PromoEvent'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await connectDB()
  const body = await readBody(event)
  const eventId = String(body?.eventId || '')
  if (!eventId) return { success: false, message: 'eventId обязателен' }
  const ev = await PromoEvent.findById(eventId)
  if (!ev) return { success: false, message: 'Ивент не найден' }
  const now = new Date()
  if (!ev.published || ev.startAt > now || ev.endAt < now) return { success: false, message: 'Ивент не активен' }
  const row = await PromoProgress.findOneAndUpdate(
    { userId: user._id, eventId: ev._id },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  )
  const completed = row.count >= ev.requiredCount && !row.completedAt
  if (completed) {
    row.completedAt = new Date()
    await row.save()
  }
  return { success: true, progress: { count: row.count, completed: !!row.completedAt } }
})


