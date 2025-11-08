import { getHeader, getCookie } from 'h3'
import connectDB from '~/server/utils/mongodb'
import GuestVisit from '~/server/models/GuestVisit'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'

// Функция для получения IP адреса клиента
function getClientIP(event: any): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIP = getHeader(event, 'x-real-ip')
  const remoteAddress = event.node.req.socket?.remoteAddress
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddress || 'unknown'
}

export default defineEventHandler(async (event) => {
  // Отслеживаем только GET запросы к страницам (не API)
  if (event.node.req.method !== 'GET') return
  
  const path = event.node.req.url || ''
  
  // Пропускаем API запросы и статические файлы
  if (path.startsWith('/api/') || 
      path.startsWith('/_nuxt/') || 
      path.startsWith('/favicon') ||
      path.includes('.')) {
    return
  }
  
  // Пропускаем ботов
  const userAgent = getHeader(event, 'user-agent') || ''
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent)
  if (isBot) return
  
  try {
    await connectDB()
    
    // Проверяем, авторизован ли пользователь
    const token = getCookie(event, 'token')
    let isLoggedIn = false
    
    if (token) {
      try {
        const { jwtSecret } = useRuntimeConfig()
        const decoded = jwt.verify(token, jwtSecret) as any
        if (decoded?.userId) {
          isLoggedIn = true
          
          // Обновляем lastVisit для авторизованного пользователя
          const now = new Date()
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          await User.findById(decoded.userId).then(async (user) => {
            if (user) {
              const lastVisit = user.lastVisit ? new Date(user.lastVisit) : null
              const lastVisitDate = lastVisit ? new Date(lastVisit) : null
              lastVisitDate?.setHours(0, 0, 0, 0)
              
              if (!lastVisit || !lastVisitDate || lastVisitDate.getTime() < today.getTime()) {
                await User.findByIdAndUpdate(user._id, { lastVisit: now }).catch(() => {})
              }
            }
          }).catch(() => {})
        }
      } catch {}
    }
    
    // Если пользователь не авторизован, сохраняем гостевое посещение
    if (!isLoggedIn) {
      const ip = getClientIP(event) || 'unknown'
      const now = new Date()
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      
      // Проверяем, было ли сегодня уже посещение с этого IP
      const existingVisit = await GuestVisit.findOne({
        ip,
        date: { $gte: today }
      })
      
      // Сохраняем только одно посещение в день с одного IP
      if (!existingVisit) {
        await GuestVisit.create({
          ip,
          userAgent,
          date: now
        }).catch((err) => {
          // Логируем ошибки для отладки, но не ломаем основной запрос
          console.error('Ошибка сохранения гостевого посещения:', err)
        })
      }
    }
  } catch (error) {
    // Логируем ошибки для отладки, но не ломаем основной запрос
    console.error('Ошибка в track-visits middleware:', error)
  }
})

