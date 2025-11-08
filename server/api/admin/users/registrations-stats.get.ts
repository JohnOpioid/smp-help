import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  const query = getQuery(event)
  const days = parseInt(query.days as string) || 30 // По умолчанию последние 30 дней
  
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999) // Включаем сегодняшний день полностью
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (days - 1)) // (days-1) дней назад + сегодня = days дней
  startDate.setHours(0, 0, 0, 0)
  
  // Группируем регистрации по дням
  const registrations = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $project: {
        date: '$_id',
        count: 1,
        _id: 0
      }
    }
  ])
  
  // Заполняем пропущенные дни нулями (включая сегодня)
  const result: Array<{ date: string; count: number }> = []
  
  // Генерируем дни от самого старого до сегодня включительно
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i) // Добавляем i дней к начальной дате (0 до days-1)
    date.setHours(0, 0, 0, 0) // Убеждаемся, что время установлено на начало дня
    
    // Форматируем дату в YYYY-MM-DD с учетом локального времени
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const existing = registrations.find((r: any) => r.date === dateStr)
    result.push({
      date: dateStr,
      count: existing ? existing.count : 0
    })
  }
  
  return {
    success: true,
    data: result
  }
})

