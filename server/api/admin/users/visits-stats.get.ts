import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import GuestVisit from '~/server/models/GuestVisit'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  const query = getQuery(event)
  const days = parseInt(query.days as string) || 30 // По умолчанию последние 30 дней
  
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999) // Включаем сегодняшний день полностью
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (days - 1)) // -1 чтобы включить сегодня
  startDate.setHours(0, 0, 0, 0)
  
  // Группируем посещения залогиненных пользователей по дням
  const loggedInVisits = await User.aggregate([
    {
      $match: {
        lastVisit: { $gte: startDate, $lte: endDate, $exists: true }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$lastVisit'
          }
        },
        users: { $addToSet: '$_id' }
      }
    },
    {
      $project: {
        date: '$_id',
        count: { $size: '$users' },
        _id: 0
      }
    },
    {
      $sort: { date: 1 }
    }
  ])
  
  // Группируем гостевые посещения по дням (уникальные IP в день)
  const guestVisits = await GuestVisit.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$date'
          }
        },
        // Считаем уникальные IP адреса в день
        ips: { $addToSet: '$ip' }
      }
    },
    {
      $project: {
        date: '$_id',
        count: { $size: '$ips' },
        _id: 0
      }
    },
    {
      $sort: { date: 1 }
    }
  ])
  
  // Объединяем данные по дням (включая сегодня)
  const result: Array<{ date: string; loggedIn: number; guests: number }> = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Генерируем дни от самого старого до сегодня включительно
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - (days - 1 - i)) // От старого к новому, включая сегодня
    const dateStr = date.toISOString().split('T')[0]
    
    const loggedIn = loggedInVisits.find((r: any) => r.date === dateStr)
    const guests = guestVisits.find((r: any) => r.date === dateStr)
    
    result.push({
      date: dateStr,
      loggedIn: loggedIn ? loggedIn.count : 0,
      guests: guests ? guests.count : 0
    })
  }
  
  return {
    success: true,
    data: result
  }
})

