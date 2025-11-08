import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  const query = getQuery(event)
  const days = parseInt(query.days as string) || 30 // По умолчанию последние 30 дней
  
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999) // Включаем сегодняшний день полностью
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (days - 1)) // -1 чтобы включить сегодня
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
            date: '$createdAt'
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Генерируем дни от самого старого до сегодня включительно
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - (days - 1 - i)) // От старого к новому, включая сегодня
    const dateStr = date.toISOString().split('T')[0]
    
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

