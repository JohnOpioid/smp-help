// scripts/import-data.cjs
const { MongoClient } = require('mongodb')
const fs = require('fs')
const path = require('path')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smp-help'

async function importDataToMongoDB() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Подключение к MongoDB установлено')
    
    const db = client.db('smp-help')
    
    const collections = [
      'drugs', 'drugs2', 'algorithms', 'algorithmcategories', 'algorithmsections',
      'mkbs', 'mkbcategories', 'regions', 'regionphones', 'substations',
      'instructions', 'localstatuses', 'localstatuscategories',
      'shifts', 'shifttemplates', 'shiftalternations', 'categories'
    ]
    
    for (const collectionName of collections) {
      try {
        const filePath = path.join(process.cwd(), 'mongodb', `smp-help.${collectionName}.json`)
        
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  Файл ${filePath} не найден, пропускаем`)
          continue
        }
        
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const data = JSON.parse(fileContent)
        
        if (!Array.isArray(data)) {
          console.log(`⚠️  Данные в ${collectionName} не являются массивом, пропускаем`)
          continue
        }
        
        const collection = db.collection(collectionName)
        
        // Очищаем коллекцию перед импортом
        await collection.deleteMany({})
        
        // Вставляем данные
        if (data.length > 0) {
          await collection.insertMany(data)
          console.log(`✅ ${collectionName}: импортировано ${data.length} записей`)
        } else {
          console.log(`⚠️  ${collectionName}: файл пустой`)
        }
        
      } catch (error) {
        console.error(`❌ Ошибка импорта ${collectionName}:`, error)
      }
    }
    
    console.log('🎉 Импорт данных завершён!')
    
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error)
  } finally {
    await client.close()
  }
}

// Запуск импорта
importDataToMongoDB()
