import { defineEventHandler, setHeader } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'
import MKB from '~/server/models/MKB'
import Algorithm from '~/server/models/Algorithm'
import Drug from '~/server/models/Drug'
import Substation from '~/server/models/Substation'

export default defineEventHandler(async (event) => {
  // Отключаем кэширование для этого endpoint
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Expires', '0')
  
  try {
    console.log('🔍 API: Подключаемся к базе данных...')
    console.log('🔍 API: MONGODB_URI:', process.env.MONGODB_URI ? 'настроен' : 'НЕ НАСТРОЕН')
    console.log('🔍 API: NODE_ENV:', process.env.NODE_ENV)
    
    await connectDB()
    console.log('✅ API: Подключение к БД успешно')
    
    // Проверяем подключение к базе данных
    const db = await connectDB()
    if (!db) {
      console.error('❌ API: Нет подключения к базе данных')
      return {
        success: false,
        message: 'Ошибка подключения к базе данных',
        data: null,
        totalItems: 0
      }
    }
    
    console.log('✅ API: База данных доступна')
    console.log('🔍 API: Состояние подключения:', db.connection.readyState)
    console.log('🔍 API: Имя базы данных:', db.connection.name)
    
    console.log('🔍 API: Начинаем загрузку данных для поиска...')
    
    // Добавляем диагностику подключения к моделям
    console.log('🔍 API: Проверяем модели...')
    console.log('  - LocalStatus model:', !!LocalStatus)
    console.log('  - MKB model:', !!MKB)
    console.log('  - Algorithm model:', !!Algorithm)
    console.log('  - Drug model:', !!Drug)
    console.log('  - Substation model:', !!Substation)
    
    // Проверяем подключение к базе данных более детально
    try {
      const mongoose = await import('mongoose')
      console.log('🔍 API: Состояние подключения к БД:', mongoose.default.connection.readyState)
      console.log('🔍 API: Имя базы данных:', mongoose.default.connection.name)
      console.log('🔍 API: Хост базы данных:', mongoose.default.connection.host)
    } catch (err) {
      console.error('❌ API: Ошибка при проверке подключения к БД:', err)
    }
    
    // Проверяем коллекции в базе данных
    try {
      const collections = await db.connection.db.listCollections().toArray()
      console.log('🔍 API: Доступные коллекции:', collections.map(c => c.name))
      
      // Проверяем количество документов в каждой коллекции
      for (const collection of collections) {
        try {
          const count = await db.connection.db.collection(collection.name).countDocuments()
          console.log(`🔍 API: Коллекция ${collection.name}: ${count} документов`)
        } catch (err) {
          console.error(`❌ API: Ошибка при подсчете документов в ${collection.name}:`, err)
        }
      }
    } catch (err) {
      console.error('❌ API: Ошибка получения списка коллекций:', err)
    }
    
    // Получаем данные из каждой коллекции отдельно для диагностики
    console.log('🔍 API: Загружаем LocalStatus...')
    let localStatuses = []
    try {
      // Сначала пробуем без populate
      const localStatusesRaw = await LocalStatus.find({}).lean()
      console.log('✅ API: LocalStatus загружены без populate:', localStatusesRaw.length)
      
      // Если данные есть, пробуем с populate
      if (localStatusesRaw.length > 0) {
        localStatuses = await LocalStatus.find({}).populate('category', 'name url').lean()
        console.log('✅ API: LocalStatus загружены с populate:', localStatuses.length)
      } else {
        localStatuses = localStatusesRaw
        console.log('⚠️ API: LocalStatus пусты, используем данные без populate')
      }
    } catch (err) {
      console.error('❌ API: Ошибка загрузки LocalStatus:', err)
      localStatuses = []
    }
    
    console.log('🔍 API: Загружаем MKB...')
    let mkbCodes = []
    try {
      // Сначала пробуем без populate
      const mkbCodesRaw = await MKB.find({}).lean()
      console.log('✅ API: MKB загружены без populate:', mkbCodesRaw.length)
      
      // Если данные есть, пробуем с populate
      if (mkbCodesRaw.length > 0) {
        mkbCodes = await MKB.find({}).populate('category', 'name url').lean()
        console.log('✅ API: MKB загружены с populate:', mkbCodes.length)
      } else {
        mkbCodes = mkbCodesRaw
        console.log('⚠️ API: MKB пусты, используем данные без populate')
      }
    } catch (err) {
      console.error('❌ API: Ошибка загрузки MKB:', err)
      mkbCodes = []
    }
    
    console.log('🔍 API: Загружаем Algorithm...')
    let algorithms = []
    try {
      // Сначала пробуем без populate
      const algorithmsRaw = await Algorithm.find({}).lean()
      console.log('✅ API: Algorithm загружены без populate:', algorithmsRaw.length)
      
      // Если данные есть, пробуем с populate
      if (algorithmsRaw.length > 0) {
        algorithms = await Algorithm.find({}).populate('category', 'name url').populate('section', 'name url').lean()
        console.log('✅ API: Algorithm загружены с populate:', algorithms.length)
      } else {
        algorithms = algorithmsRaw
        console.log('⚠️ API: Algorithm пусты, используем данные без populate')
      }
    } catch (err) {
      console.error('❌ API: Ошибка загрузки Algorithm:', err)
      algorithms = []
    }
    
    console.log('🔍 API: Загружаем Drug...')
    let drugs = []
    try {
      // Сначала пробуем без populate
      const drugsRaw = await Drug.find({}).lean()
      console.log('✅ API: Drug загружены без populate:', drugsRaw.length)
      
      // Если данные есть, пробуем с populate
      if (drugsRaw.length > 0) {
        drugs = await Drug.find({}).populate('categories', 'name url').lean()
        console.log('✅ API: Drug загружены с populate:', drugs.length)
      } else {
        drugs = drugsRaw
        console.log('⚠️ API: Drug пусты, используем данные без populate')
      }
    } catch (err) {
      console.error('❌ API: Ошибка загрузки Drug:', err)
      drugs = []
    }
    
    console.log('🔍 API: Загружаем Substation...')
    let substations = []
    try {
      // Сначала пробуем без populate
      const substationsRaw = await Substation.find({}).lean()
      console.log('✅ API: Substation загружены без populate:', substationsRaw.length)
      
      // Если данные есть, пробуем с populate
      if (substationsRaw.length > 0) {
        substations = await Substation.find({}).populate('region', 'name').lean()
        console.log('✅ API: Substation загружены с populate:', substations.length)
      } else {
        substations = substationsRaw
        console.log('⚠️ API: Substation пусты, используем данные без populate')
      }
    } catch (err) {
      console.error('❌ API: Ошибка загрузки Substation:', err)
      substations = []
    }
    
    console.log('📊 API: Результаты загрузки:')
    console.log(`  - LocalStatus: ${localStatuses.length}`)
    console.log(`  - MKB: ${mkbCodes.length}`)
    console.log(`  - Algorithm: ${algorithms.length}`)
    console.log(`  - Drug: ${drugs.length}`)
    console.log(`  - Substation: ${substations.length}`)
    
    // Проверяем количество документов в каждой коллекции
    try {
      const localStatusCount = await LocalStatus.countDocuments()
      const mkbCount = await MKB.countDocuments()
      const algorithmCount = await Algorithm.countDocuments()
      const drugCount = await Drug.countDocuments()
      const substationCount = await Substation.countDocuments()
      
      console.log('📊 API: Количество документов в коллекциях:')
      console.log(`  - LocalStatus: ${localStatusCount}`)
      console.log(`  - MKB: ${mkbCount}`)
      console.log(`  - Algorithm: ${algorithmCount}`)
      console.log(`  - Drug: ${drugCount}`)
      console.log(`  - Substation: ${substationCount}`)
    } catch (err) {
      console.error('❌ API: Ошибка подсчета документов:', err)
    }
    
    // Детальная диагностика каждой коллекции
    if (localStatuses.length > 0) {
      console.log('📝 LocalStatus sample:', {
        _id: localStatuses[0]._id,
        title: localStatuses[0].title,
        category: localStatuses[0].category
      })
    }
    
    if (mkbCodes.length > 0) {
      console.log('📝 MKB sample:', {
        _id: mkbCodes[0]._id,
        title: mkbCodes[0].title,
        category: mkbCodes[0].category
      })
    }
    
    if (algorithms.length > 0) {
      console.log('📝 Algorithm sample:', {
        _id: algorithms[0]._id,
        title: algorithms[0].title,
        category: algorithms[0].category,
        section: algorithms[0].section
      })
    }
    
    if (drugs.length > 0) {
      console.log('📝 Drug sample:', {
        _id: drugs[0]._id,
        name: drugs[0].name,
        categories: drugs[0].categories
      })
    }
    
    if (substations.length > 0) {
      console.log('📝 Substation sample:', {
        _id: substations[0]._id,
        name: substations[0].name,
        region: substations[0].region
      })
    }
    
    // Проверяем, что хотя бы одна коллекция не пустая
    const totalItems = localStatuses.length + mkbCodes.length + algorithms.length + drugs.length + substations.length
    if (totalItems === 0) {
      return {
        success: false,
        message: 'Все коллекции данных пусты',
        data: {
          localStatuses: { items: [], total: 0 },
          mkbCodes: { items: [], total: 0 },
          algorithms: { items: [], total: 0 },
          drugs: { items: [], total: 0 },
          substations: { items: [], total: 0 }
        },
        totalItems: 0
      }
    }
    
    return {
      success: true,
      data: {
        localStatuses: {
          items: localStatuses,
          total: localStatuses.length
        },
        mkbCodes: {
          items: mkbCodes,
          total: mkbCodes.length
        },
        algorithms: {
          items: algorithms,
          total: algorithms.length
        },
        drugs: {
          items: drugs,
          total: drugs.length
        },
        substations: {
          items: substations,
          total: substations.length
        }
      },
      totalItems: totalItems
    }
  } catch (error) {
    console.error('❌ API: Ошибка при получении данных для поиска:', error)
    return { 
      success: false, 
      message: 'Ошибка при получении данных для поиска',
      data: {
        localStatuses: { items: [], total: 0 },
        mkbCodes: { items: [], total: 0 },
        algorithms: { items: [], total: 0 },
        drugs: { items: [], total: 0 },
        substations: { items: [], total: 0 }
      },
      totalItems: 0
    }
  }
})