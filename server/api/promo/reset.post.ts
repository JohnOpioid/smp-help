import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoParticipant from '~/server/models/PromoParticipant'
import PromoProgress from '~/server/models/PromoProgress'
import PromoWinner from '~/server/models/PromoWinner'
import PromoEvent from '~/server/models/PromoEvent'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    await connectDB()
    const body = await readBody(event)
    const id = body?.eventId || body?.id
    if (!id) {
      return { success: false, message: 'id обязателен' }
    }
    
    // Проверяем, что ивент существует
    const promoEvent = await PromoEvent.findById(id)
    if (!promoEvent) {
      return { success: false, message: 'Ивент не найден' }
    }
    
    // Удаляем всех участников
    const deletedParticipants = await PromoParticipant.deleteMany({ eventId: id })
    
    // Обнуляем все счетчики прогресса (устанавливаем count = 0 и удаляем completedAt)
    await PromoProgress.updateMany(
      { eventId: id },
      { $set: { count: 0 }, $unset: { completedAt: 1 } }
    )
    
    // Удаляем всех победителей
    const deletedWinners = await PromoWinner.deleteMany({ eventId: id })
    
    // Получаем количество обновленных прогрессов
    const progressCount = await PromoProgress.countDocuments({ eventId: id })
    
    return {
      success: true,
      message: 'Ивент обнулен',
      deleted: {
        participants: deletedParticipants.deletedCount || 0,
        progress: progressCount || 0,
        winners: deletedWinners.deletedCount || 0
      }
    }
  } catch (error: any) {
    console.error('Ошибка обнуления ивента:', error)
    return {
      success: false,
      message: error?.message || 'Ошибка обнуления ивента'
    }
  }
})

