import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import MKBCategory from '~/server/models/MKBCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const range = getRouterParam(event, 'range')

  console.log('🔍 Получен параметр range:', range)
  console.log('🔍 Тип параметра:', typeof range)

  if (!range) {
    return { success: false, message: 'Диапазон кодов МКБ не указан' }
  }

  try {
    // Проверяем, является ли это диапазоном
    if (!range.includes('–') && !range.includes('-')) {
      return { success: false, message: 'Не является диапазоном кодов' }
    }

    const separator = range.includes('–') ? '–' : '-'
    const [start, end] = range.split(separator).map(s => s.trim())
    
    if (!start || !end) {
      return { success: false, message: 'Не удалось разделить диапазон' }
    }

    // Извлекаем буквенную часть и числовую часть
    const startMatch = start.match(/^([A-Z])(\d+)$/)
    const endMatch = end.match(/^([A-Z])(\d+)$/)
    
    console.log('🔍 Парсинг диапазона:', { start, end, startMatch, endMatch })
    
    if (!startMatch || !endMatch) {
      return { success: false, message: 'Не удалось распарсить коды диапазона' }
    }
    
    const [, startLetter, startNum] = startMatch
    const [, endLetter, endNum] = endMatch
    
    // Проверяем, что буквы совпадают
    if (startLetter !== endLetter) {
      return { success: false, message: 'Буквы в диапазоне не совпадают' }
    }

    // Генерируем несколько кодов из диапазона для поиска
    const startNumber = parseInt(startNum)
    const endNumber = parseInt(endNum)
    const searchCodes: string[] = []
    
    // Добавляем начальный и конечный коды, а также несколько промежуточных
    searchCodes.push(`${startLetter}${startNum.padStart(2, '0')}.0`)
    if (startNumber !== endNumber) {
      searchCodes.push(`${startLetter}${endNum.padStart(2, '0')}.0`)
      // Добавляем средний код если диапазон больше 1
      if (endNumber - startNumber > 1) {
        const middleNum = Math.floor((startNumber + endNumber) / 2)
        searchCodes.push(`${startLetter}${middleNum.toString().padStart(2, '0')}.0`)
      }
    }

    console.log('🔍 Ищем категорию для диапазона:', range)
    console.log('🔍 Коды для поиска:', searchCodes)

    // Ищем любой из кодов в базе данных
    for (const code of searchCodes) {
      const diagnosis = await MKB.findOne({ mkbCode: code }).populate('category', 'name url').lean()
      
      if (diagnosis && diagnosis.category) {
        console.log('✅ Найден код:', code, 'в категории:', diagnosis.category.name)
        return {
          success: true,
          category: diagnosis.category,
          foundCode: code,
          range: range
        }
      }
    }

    return { success: false, message: 'Не найдена категория для данного диапазона кодов' }
  } catch (error) {
    console.error('Ошибка при поиске категории для диапазона:', error)
    return { success: false, message: 'Ошибка при поиске категории' }
  }
})
