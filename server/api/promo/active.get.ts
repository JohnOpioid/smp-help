import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoEvent from '~/server/models/PromoEvent'

export default defineEventHandler(async () => {
  await connectDB()
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentDate = now.getDate()
  
  // Получаем все опубликованные ивенты
  const allEvents = await PromoEvent.find({ published: true }).lean()
  
  // Фильтруем ивенты
  const activeEvent = allEvents.find((event: any) => {
    const startDate = new Date(event.startAt)
    const endDate = new Date(event.endAt)
    
    if (event.isRecurring) {
      // Для повторяющихся ивентов проверяем по месяцу и дню
      const startMonth = startDate.getMonth()
      const startDay = startDate.getDate()
      const endMonth = endDate.getMonth()
      const endDay = endDate.getDate()
      
      // Проверяем, попадает ли текущая дата в диапазон дней года
      const currentMonthDay = currentMonth * 100 + currentDate
      const startMonthDay = startMonth * 100 + startDay
      const endMonthDay = endMonth * 100 + endDay
      
      // Если диапазон не переходит через новый год (например, 10-30 до 11-15)
      if (startMonthDay <= endMonthDay) {
        return currentMonthDay >= startMonthDay && currentMonthDay <= endMonthDay
      } else {
        // Если диапазон переходит через новый год (например, 11-25 до 01-05)
        return currentMonthDay >= startMonthDay || currentMonthDay <= endMonthDay
      }
    } else {
      // Для не повторяющихся ивентов проверяем полную дату
      return startDate <= now && endDate >= now
    }
  })
  
  // Если нашли активный, возвращаем его, иначе null
  return { success: true, item: activeEvent || null }
})


