import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Calculator from '~/server/models/Calculator'

// Метаданные калькуляторов из seed файла
const CALCULATORS_METADATA = {
  'gcs': {
    name: 'Шкала комы Глазго (GCS)',
    description: 'Оценка уровня сознания',
    category: 'Сознание',
    keywords: ['глазго', 'gcs', 'шкала комы', 'сознание', 'кома', 'оглушение', 'сопор', 'glasgow', 'coma scale', 'шкала']
  },
  'four': {
    name: 'Шкала FOUR',
    description: 'Глубина комы у интубированных',
    category: 'Сознание',
    keywords: ['four', 'шкала four', 'интубированные', 'кома', 'сознание', 'фоур']
  },
  'rass': {
    name: 'Шкала RASS',
    description: 'Возбуждение–седация (реанимация/ИТ)',
    category: 'Сознание',
    keywords: ['rass', 'седация', 'возбуждение', 'реанимация', 'ит', 'ричмонд', 'расс', 'шкала расс']
  },
  'shoks': {
    name: 'Шкала ШОКС',
    description: 'Хроническая сердечная недостаточность',
    category: 'Клинические состояния',
    keywords: ['шокс', 'хсн', 'сердечная недостаточность', 'хроническая', 'функциональный класс', 'шкала шокс', 'шок']
  },
  'news': {
    name: 'Шкала NEWS',
    description: 'Оценка тяжести состояния при COVID-19',
    category: 'Клинические состояния',
    keywords: ['news', 'early warning', 'тяжесть', 'ковид', 'covid', 'состояние', 'нюс', 'ньюс', 'шкала ньюс']
  },
  'pain-vas': {
    name: 'Интенсивность боли',
    description: 'ВАШ и шкала Вонга–Бейкера',
    category: 'Клинические состояния',
    keywords: ['боль', 'ваш', 'визуальная аналоговая шкала', 'вонг бейкер', 'боль у детей', 'vas', 'боль пациента', 'оценка боли', 'болевой синдром']
  },
  'lams': {
    name: 'Шкала LAMS',
    description: 'Догоспитальная диагностика инсульта',
    category: 'Клинические состояния',
    keywords: ['lams', 'инсульт', 'диагностика', 'догоспитальная', 'ламс', 'шкала ламс', 'цвб', 'цереброваскулярное']
  },
  'geneva-pe': {
    name: 'Шкала оценки вероятности ТЭЛА',
    description: 'Женевская шкала',
    category: 'Клинические состояния',
    keywords: ['тэла', 'геневская шкала', 'тромбоэмболия', 'легочная эмболия', 'geneva', 'тела', 'эмболия', 'легочная']
  },
  'pregnancy-due-date': {
    name: 'Калькулятор срока беременности',
    description: 'Определение предполагаемой даты родов',
    category: 'Клинические состояния',
    keywords: ['беременность', 'роды', 'пдр', 'срок беременности', 'дата родов', 'гестация', 'срок', 'дата', 'родоразрешение', 'недель']
  },
  'pediatric-norms': {
    name: 'Физиологические возрастные нормы',
    description: 'Нормы ЧДД, ЧСС, АД у детей',
    category: 'Педиатрические',
    keywords: ['педиатрия', 'дети', 'нормы', 'чдд', 'чсс', 'ад', 'возрастные нормы', 'дыхание', 'пульс', 'давление', 'частота дыхания', 'частота сердцебиения']
  },
  'gcs-pediatric': {
    name: 'Детская шкала Глазго',
    description: 'Оценка сознания у детей до 1 года и 1-4 лет',
    category: 'Педиатрические',
    keywords: ['детская глазго', 'дети глазго', 'педиатрия глазго', 'сознание детей']
  },
  'apgar': {
    name: 'Шкала Апгар',
    description: 'Оценка состояния новорожденного',
    category: 'Педиатрические',
    keywords: ['апгар', 'новорожденный', 'оценка новорожденного', 'шкала апгар', 'атгар', 'атгар', 'ребенок', 'новорожденные']
  },
  'flacc': {
    name: 'Шкала FLACC',
    description: 'Оценка боли у детей до 7 лет',
    category: 'Педиатрические',
    keywords: ['flacc', 'flack', 'флакк', 'оценка боли', 'боль у детей', 'педиатрия', 'дети', 'боль', 'оценка боли дети', 'поведенческая шкала']
  },
  'ciwa-ar': {
    name: 'Шкала CIWA-AR',
    description: 'Тяжесть алкогольного абстинентного синдрома',
    category: 'Другие',
    keywords: ['ciwa', 'ciwa-ar', 'алкоголь', 'абстинентный синдром', 'али', 'алкоголизм', 'сива', 'сиваар', 'аддикция']
  },
  'shors': {
    name: 'ШОРС',
    description: 'Шкала оценки риска суицида',
    category: 'Другие',
    keywords: ['шорс', 'suicide', 'суицид', 'риск', 'оценка риска', 'депрессия', 'суицидальный', 'suicidal', 'шкала суицида']
  },
  'burn-area': {
    name: 'Площадь ожоговой поверхности',
    description: 'Определение площади ожоговой поверхности по правилу ладони и правилу девяток',
    category: 'Клинические состояния',
    keywords: ['ожог', 'площадь ожога', 'ожоговая поверхность', 'правило ладони', 'правило девяток', 'lund browder', 'ожоги', 'ожоговая травма', 'термическая травма', 'burn', 'burn area']
  }
  ,
  'rule-of-nines': {
    name: 'Правило «девяток» (TBSA)',
    description: 'Оценка площади ожогов у взрослых по анатомическим зонам, кратным 9%.',
    category: 'Другие',
    keywords: ['ожог', 'правило девяток', 'tbsa', 'burns', 'rule of nines', 'ожоги', 'термические ожоги', 'площадь ожогов']
  },
  'sexual-formula': {
    name: 'Половая формула (Танер)',
    description: 'Ma/P/Ax/Me (девочки) и P/Ax/V (мальчики) по стадиям Танера.',
    category: 'Педиатрические',
    keywords: ['танер', 'tanner', 'половая формула', 'puberty', 'ma', 'ax', 'p', 'v', 'менархе', 'pubic hair', 'genital stage']
  },
  'westley-croup': {
    name: 'Шкала Westley Croup',
    description: 'Оценка тяжести крупа у детей по 5 признакам',
    category: 'Педиатрические',
    keywords: ['круп', 'westley', 'уэстли', 'stridor', 'цианоз', 'втяжение', 'дыхание', 'дети', 'laryngitis', 'tracheitis']
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { calculators } = await readBody(event)
    
    if (!Array.isArray(calculators) || calculators.length === 0) {
      return {
        success: false,
        message: 'Список калькуляторов пуст'
      }
    }

    await connectDB()

    const results = []

    for (const calcId of calculators) {
      const metadata = CALCULATORS_METADATA[calcId]
      
      if (!metadata) {
        results.push({
          id: calcId,
          success: false,
          message: `Метаданные для калькулятора ${calcId} не найдены`
        })
        continue
      }

      const url = `/calculators/${calcId}`

      // Проверяем, существует ли уже в БД
      const existing = await Calculator.findOne({ url }).lean()
      
      if (existing) {
        results.push({
          id: calcId,
          success: false,
          message: 'Калькулятор уже существует в базе данных'
        })
        continue
      }

      // Добавляем в БД
      const calculator = await Calculator.create({
        name: metadata.name,
        description: metadata.description,
        url,
        category: metadata.category,
        keywords: metadata.keywords
      })

      results.push({
        id: calcId,
        success: true,
        message: `Калькулятор ${metadata.name} успешно добавлен`
      })
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return {
      success: true,
      message: `Добавлено калькуляторов: ${successCount}, ошибок: ${failCount}`,
      results,
      stats: {
        total: calculators.length,
        success: successCount,
        failed: failCount
      }
    }
  } catch (error: any) {
    console.error('Ошибка добавления калькуляторов:', error)
    return {
      success: false,
      message: error.message
    }
  }
})

