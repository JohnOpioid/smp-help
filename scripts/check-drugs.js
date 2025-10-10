// Простой скрипт для проверки препаратов в БД
import mongoose from 'mongoose'
import Drug from '../server/models/Drug.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smp-help'

async function checkDrugs() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Подключено к MongoDB')
    
    // Ищем эуфиллин
    const eufillinSearch = await Drug.find({
      $or: [
        { name: /эуфиллин/i },
        { name: /аминофиллин/i },
        { name: /aminophylline/i },
        { name: /eufillin/i },
        { name: /теофиллин/i },
        { latinName: /aminophylline/i },
        { latinName: /theophylline/i },
        { synonyms: /эуфиллин/i },
        { synonyms: /аминофиллин/i }
      ]
    })
    
    console.log(`Найдено препаратов по запросу "эуфиллин": ${eufillinSearch.length}`)
    
    if (eufillinSearch.length > 0) {
      eufillinSearch.forEach(drug => {
        console.log(`\n--- ${drug.name} ---`)
        console.log(`Латинское название: ${drug.latinName || 'не указано'}`)
        console.log(`Синонимы: ${drug.synonyms?.join(', ') || 'не указаны'}`)
        console.log(`Педиатрическая дозировка: ${drug.pediatricDose?.join(', ') || 'не указана'}`)
        console.log(`Единица дозировки: ${drug.pediatricDoseUnit || 'не указана'}`)
        console.log(`Форма выпуска: ${drug.forms ? `${drug.forms.doseValue}${drug.forms.doseUnit} в ${drug.forms.volumeMl}мл` : 'не указана'}`)
      })
    } else {
      console.log('\nЭуфиллин не найден в базе данных!')
      
      // Показываем все препараты
      const allDrugs = await Drug.find({}).limit(10)
      console.log(`\nВсего препаратов в БД: ${await Drug.countDocuments()}`)
      console.log('\nПервые 10 препаратов:')
      allDrugs.forEach(drug => {
        console.log(`- ${drug.name} (${drug.latinName || 'без лат. названия'})`)
      })
    }
    
  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkDrugs()
