import { defineEventHandler, setHeader } from 'h3'
import connectDB from '~/server/utils/mongodb'

export default defineEventHandler(async (event) => {
  // Отключаем кэширование для этого endpoint
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Expires', '0')
  
  try {
    console.log('🔍 DB TEST: Начинаем тест подключения к базе данных...')
    console.log('🔍 DB TEST: MONGODB_URI:', process.env.MONGODB_URI ? 'настроен' : 'НЕ НАСТРОЕН')
    console.log('🔍 DB TEST: NODE_ENV:', process.env.NODE_ENV)
    
    const db = await connectDB()
    console.log('✅ DB TEST: Подключение к БД успешно')
    
    const connectionState = db.connection.readyState
    const dbName = db.connection.name
    const host = db.connection.host
    const port = db.connection.port
    
    console.log('🔍 DB TEST: Состояние подключения:', connectionState)
    console.log('🔍 DB TEST: Имя базы данных:', dbName)
    console.log('🔍 DB TEST: Хост:', host)
    console.log('🔍 DB TEST: Порт:', port)
    
    // Проверяем коллекции
    let collections = []
    try {
      collections = await db.connection.db.listCollections().toArray()
      console.log('🔍 DB TEST: Доступные коллекции:', collections.map(c => c.name))
    } catch (err) {
      console.error('❌ DB TEST: Ошибка получения списка коллекций:', err)
    }
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      connection: {
        state: connectionState,
        dbName,
        host,
        port,
        collections: collections.map(c => c.name)
      },
      environment: {
        mongodbUri: process.env.MONGODB_URI ? 'настроен' : 'НЕ НАСТРОЕН',
        nodeEnv: process.env.NODE_ENV
      }
    }
  } catch (error) {
    console.error('❌ DB TEST: Ошибка подключения к базе данных:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: {
        mongodbUri: process.env.MONGODB_URI ? 'настроен' : 'НЕ НАСТРОЕН',
        nodeEnv: process.env.NODE_ENV
      }
    }
  }
})
