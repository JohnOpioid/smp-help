import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import Drug from '~/server/models/Drug'
import Instruction from '~/server/models/Instruction'
import LocalStatus from '~/server/models/LocalStatus'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const searchTerm = query.q as string

    if (!searchTerm || searchTerm.length < 2) {
      return {
        success: true,
        results: [],
        message: 'Введите минимум 2 символа для поиска'
      }
    }

    await connectDB()

    const results: any[] = []
    const searchRegex = new RegExp(searchTerm, 'i')

    // Поиск в МКБ
    try {
      const mkbResults = await MKB.find({
        $or: [
          { name: searchRegex },
          { mkbCode: searchRegex },
          { stationCode: searchRegex },
          { note: searchRegex }
        ]
      }).populate('category').limit(3)

      mkbResults.forEach(item => {
        results.push({
          id: item._id.toString(),
          title: item.name,
          description: item.note || 'Диагноз по МКБ-10',
          type: 'mkb',
          codes: {
            mkbCode: item.mkbCode,
            stationCode: item.stationCode
          },
          category: item.category?.name,
          data: item
        })
      })
    } catch (error) {
      console.error('Ошибка поиска в МКБ:', error)
    }

    // Поиск в препаратах
    try {
      const drugResults = await Drug.find({
        $or: [
          { name: searchRegex },
          { latinName: searchRegex },
          { description: searchRegex },
          { synonyms: searchRegex }
        ]
      }).limit(3)

      drugResults.forEach(item => {
        results.push({
          id: item._id.toString(),
          title: item.name,
          description: item.description || 'Лекарственный препарат',
          type: 'drug',
          latinName: item.latinName,
          forms: item.forms,
          data: item
        })
      })
    } catch (error) {
      console.error('Ошибка поиска в препаратах:', error)
    }

    // Поиск в инструкциях
    try {
      const instructionResults = await Instruction.find({
        $or: [
          { title: searchRegex },
          { content: searchRegex }
        ]
      }).limit(2)

      instructionResults.forEach(item => {
        results.push({
          id: item._id.toString(),
          title: item.title,
          description: item.content?.substring(0, 150) + '...' || 'Инструкция',
          type: 'instruction',
          data: item
        })
      })
    } catch (error) {
      console.error('Ошибка поиска в инструкциях:', error)
    }

    // Поиск в локальных статусах
    try {
      const localStatusResults = await LocalStatus.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { note: searchRegex }
        ]
      }).populate('category').limit(2)

      localStatusResults.forEach(item => {
        results.push({
          id: item._id.toString(),
          title: item.name,
          description: item.description || item.note || 'Локальный статус',
          type: 'local-status',
          category: item.category?.name,
          data: item
        })
      })
    } catch (error) {
      console.error('Ошибка поиска в локальных статусах:', error)
    }

    // Генерируем умный ответ на основе результатов
    let message = ''
    let suggestions: string[] = []

    if (results.length === 0) {
      message = `К сожалению, я не нашел информации по запросу "${searchTerm}". Попробуйте использовать другие ключевые слова или задать более конкретный вопрос.`
      suggestions = [
        'Покажи все диагнозы',
        'Список препаратов',
        'Инструкции по процедурам',
        'Что такое МКБ?'
      ]
    } else {
      const drugCount = results.filter(r => r.type === 'drug').length
      const mkbCount = results.filter(r => r.type === 'mkb').length
      const instructionCount = results.filter(r => r.type === 'instruction').length
      const localStatusCount = results.filter(r => r.type === 'local-status').length

      let foundItems = []
      if (mkbCount > 0) foundItems.push(`${mkbCount} диагноз${mkbCount > 1 ? 'а' : ''}`)
      if (drugCount > 0) foundItems.push(`${drugCount} препарат${drugCount > 1 ? 'а' : ''}`)
      if (instructionCount > 0) foundItems.push(`${instructionCount} инструкци${instructionCount > 1 ? 'и' : 'ю'}`)
      if (localStatusCount > 0) foundItems.push(`${localStatusCount} локальн${localStatusCount > 1 ? 'ых статуса' : 'ый статус'}`)

      message = `Нашел ${foundItems.join(', ')} по вашему запросу:`

      // Генерируем умные предложения
      if (drugCount > 0) {
        suggestions.push('Расскажи о дозировке')
        suggestions.push('Побочные эффекты')
        suggestions.push('Аналоги препарата')
      }
      if (mkbCount > 0) {
        suggestions.push('Похожие диагнозы')
        suggestions.push('Симптомы заболевания')
      }
      if (instructionCount > 0) {
        suggestions.push('Подробная инструкция')
      }
    }

    return {
      success: true,
      results: results.slice(0, 8), // Ограничиваем до 8 результатов
      message,
      suggestions: suggestions.slice(0, 4), // Максимум 4 предложения
      query: searchTerm
    }

  } catch (error) {
    console.error('Ошибка в API чат-бота:', error)
    return {
      success: false,
      error: 'Ошибка поиска',
      results: [],
      message: 'Произошла ошибка при поиске. Попробуйте еще раз.'
    }
  }
})
