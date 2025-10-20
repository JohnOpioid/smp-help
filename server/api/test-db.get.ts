import { defineEventHandler, setHeader } from 'h3'
import connectDB from '~/server/utils/mongodb'

export default defineEventHandler(async (event) => {
  // Отключаем кэширование для этого endpoint
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Expires', '0')
  
  try {
    console.log('🔍 DB TEST: Начинаем проверку подключения к БД...')
    
    const db = await connectDB()
    if (!db) {
      return {
        success: false,
        message: 'Нет подключения к базе данных',
        timestamp: new Date().toISOString()
      }
    }
    
    console.log('✅ DB TEST: Подключение к БД успешно')
    
    // Проверяем состояние подключения
    const mongoose = await import('mongoose')
    const connectionState = mongoose.default.connection.readyState
    const connectionStates = ['disconnected', 'connected', 'connecting', 'disconnecting']
    
    console.log(`🔍 DB TEST: Состояние подключения: ${connectionStates[connectionState]} (${connectionState})`)
    console.log(`🔍 DB TEST: Имя БД: ${mongoose.default.connection.name}`)
    console.log(`🔍 DB TEST: Хост БД: ${mongoose.default.connection.host}`)
    
    // Получаем список коллекций
    const collections = await db.connection.db.listCollections().toArray()
    console.log(`🔍 DB TEST: Найдено коллекций: ${collections.length}`)
    
    const collectionInfo = []
    for (const collection of collections) {
      try {
        const count = await db.connection.db.collection(collection.name).countDocuments()
        collectionInfo.push({
          name: collection.name,
          count: count
        })
        console.log(`🔍 DB TEST: ${collection.name}: ${count} документов`)
      } catch (err) {
        console.error(`❌ DB TEST: Ошибка при подсчете ${collection.name}:`, err)
        collectionInfo.push({
          name: collection.name,
          count: 'error',
          error: err.message
        })
      }
    }
    
    return {
      success: true,
      message: 'Подключение к БД успешно',
      timestamp: new Date().toISOString(),
      connection: {
        state: connectionStates[connectionState],
        stateCode: connectionState,
        database: mongoose.default.connection.name,
        host: mongoose.default.connection.host
      },
      collections: collectionInfo
    }
  } catch (error) {
    console.error('❌ DB TEST: Ошибка при проверке БД:', error)
    return {
      success: false,
      message: 'Ошибка при проверке БД',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
})
