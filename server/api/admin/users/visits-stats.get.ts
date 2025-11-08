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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (days - 1)) // (days-1) дней назад + сегодня = days дней
  startDate.setHours(0, 0, 0, 0)
  
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'
  
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
            date: '$lastVisit',
            timezone: timezone
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
            date: '$date',
            timezone: timezone
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
  
  console.log(`[visits-stats] Генерация статистики за ${days} дней, начиная с ${startDate.toISOString()} до ${endDate.toISOString()}`)
  console.log(`[visits-stats] Timezone: ${timezone}`)
  console.log(`[visits-stats] Найдено залогиненных посещений: ${loggedInVisits.length}, гостевых: ${guestVisits.length}`)
  if (loggedInVisits.length > 0) {
    console.log(`[visits-stats] Примеры залогиненных дат:`, loggedInVisits.slice(0, 3).map((r: any) => r.date))
  }
  if (guestVisits.length > 0) {
    console.log(`[visits-stats] Примеры гостевых дат:`, guestVisits.slice(0, 3).map((r: any) => r.date))
  }
  
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
    
    const loggedIn = loggedInVisits.find((r: any) => r.date === dateStr)
    const guests = guestVisits.find((r: any) => r.date === dateStr)
    
    // Логируем для отладки (только для последних 3 дней)
    if (i >= days - 3) {
      console.log(`[visits-stats] Дата ${dateStr}: залогиненные=${loggedIn?.count || 0}, гости=${guests?.count || 0}`)
    }
    
    result.push({
      date: dateStr,
      loggedIn: loggedIn ? loggedIn.count : 0,
      guests: guests ? guests.count : 0
    })
  }
  
  // Получаем сегодняшнюю дату в локальном формате
  const now = new Date()
  const todayYear = now.getFullYear()
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0')
  const todayDay = String(now.getDate()).padStart(2, '0')
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`
  console.log(`[visits-stats] Сгенерировано ${result.length} дней, первая дата: ${result[0]?.date}, последняя дата: ${result[result.length - 1]?.date}, сегодня: ${todayStr}`)
  
  return {
    success: true,
    data: result
  }
})

