import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoEvent from '~/server/models/PromoEvent'
import PromoParticipant from '~/server/models/PromoParticipant'
import PromoPrize from '~/server/models/PromoPrize'
import PromoWinner from '~/server/models/PromoWinner'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const body = await readBody(event)
  const { eventId } = body || {}
  
  if (!eventId) return { success: false, message: 'eventId обязателен' }
  
  const promoEvent = await PromoEvent.findById(eventId)
  if (!promoEvent) return { success: false, message: 'Событие не найдено' }
  
  // Получаем всех участников
  const participants = await PromoParticipant.find({ eventId }).lean()
  if (participants.length === 0) {
    return { success: false, message: 'Нет участников для розыгрыша' }
  }
  
  // Получаем все призы
  const prizes = await PromoPrize.find({ eventId }).sort({ order: 1 }).lean()
  if (prizes.length === 0) {
    return { success: false, message: 'Нет призов для розыгрыша' }
  }
  
  // Проверяем, не был ли уже проведен розыгрыш
  const existingWinners = await PromoWinner.find({ eventId })
  if (existingWinners.length > 0) {
    return { success: false, message: 'Розыгрыш уже был проведен' }
  }
  
  // Перемешиваем участников случайным образом (Fisher-Yates shuffle)
  const shuffled = [...participants]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  // Выбираем победителей по количеству призов
  const winners: any[] = []
  const drawnAt = new Date()
  
  for (let i = 0; i < Math.min(prizes.length, shuffled.length); i++) {
    const participant = shuffled[i]
    const prize = prizes[i]
    
    const winner = await PromoWinner.create({
      userId: participant.userId,
      eventId,
      prizeId: prize._id,
      drawnAt
    })
    
    winners.push(winner)
  }
  
  // Загружаем данные победителей с populate
  const winnersPopulated = await PromoWinner.find({ eventId })
    .populate('userId', 'firstName lastName email avatarUrl')
    .populate('prizeId', 'title description imageUrl')
    .sort({ drawnAt: 1 })
    .lean()
  
  return { success: true, winners: winnersPopulated }
})


