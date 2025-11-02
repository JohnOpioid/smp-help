import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoParticipant from '~/server/models/PromoParticipant'
import PromoProgress from '~/server/models/PromoProgress'
import PromoEvent from '~/server/models/PromoEvent'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user: any = await requireUser(event)
  await connectDB()
  const body = await readBody(event)
  const { eventId } = body || {}
  if (!eventId) return { success: false, message: 'eventId обязателен' }
  
  // Проверяем, что пользователь собрал все необходимое
  const progress = await PromoProgress.findOne({ userId: user._id, eventId })
  const promoEvent = await PromoEvent.findById(eventId)
  
  if (!promoEvent) return { success: false, message: 'Событие не найдено' }
  if (!progress || progress.count < promoEvent.requiredCount) {
    return { success: false, message: 'Необходимо собрать все иконки для участия в розыгрыше' }
  }
  
  // Проверяем, не участвует ли уже
  const existing = await PromoParticipant.findOne({ userId: user._id, eventId })
  if (existing) {
    return { success: true, participant: existing, message: 'Вы уже участвуете в розыгрыше' }
  }
  
  // Добавляем участника
  const participant = await PromoParticipant.create({
    userId: user._id,
    eventId,
    participatedAt: new Date()
  })
  
  return { success: true, participant }
})

