import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Calculator from '~/server/models/Calculator'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()

    // Данные калькуляторов из pages/calculators/index.vue
    const calculators = [
      // Сознание
      {
        name: 'Шкала комы Глазго (GCS)',
        description: 'Оценка уровня сознания',
        url: '/calculators/gcs',
        category: 'Сознание',
        keywords: ['глазго', 'gcs', 'шкала комы', 'сознание', 'кома', 'оглушение', 'сопор', 'glasgow', 'coma scale', 'шкала']
      },
      {
        name: 'Шкала FOUR',
        description: 'Глубина комы у интубированных',
        url: '/calculators/four',
        category: 'Сознание',
        keywords: ['four', 'шкала four', 'интубированные', 'кома', 'сознание', 'фоур']
      },
      {
        name: 'Шкала RASS',
        description: 'Возбуждение–седация (реанимация/ИТ)',
        url: '/calculators/rass',
        category: 'Сознание',
        keywords: ['rass', 'седация', 'возбуждение', 'реанимация', 'ит', 'ричмонд', 'расс', 'шкала расс']
      },
      
      // Клинические состояния
      {
        name: 'Шкала ШОКС',
        description: 'Хроническая сердечная недостаточность',
        url: '/calculators/shoks',
        category: 'Клинические состояния',
        keywords: ['шокс', 'хсн', 'сердечная недостаточность', 'хроническая', 'функциональный класс', 'шкала шокс', 'шок']
      },
      {
        name: 'Шкала NEWS',
        description: 'Оценка тяжести состояния при COVID-19',
        url: '/calculators/news',
        category: 'Клинические состояния',
        keywords: ['news', 'early warning', 'тяжесть', 'ковид', 'covid', 'состояние', 'нюс', 'ньюс', 'шкала ньюс']
      },
      {
        name: 'Интенсивность боли',
        description: 'ВАШ и шкала Вонга–Бейкера',
        url: '/calculators/pain-vas',
        category: 'Клинические состояния',
        keywords: ['боль', 'ваш', 'визуальная аналоговая шкала', 'вонг бейкер', 'боль у детей', 'vas', 'боль пациента', 'оценка боли', 'болевой синдром']
      },
      {
        name: 'Шкала LAMS',
        description: 'Догоспитальная диагностика инсульта',
        url: '/calculators/lams',
        category: 'Клинические состояния',
        keywords: ['lams', 'инсульт', 'диагностика', 'догоспитальная', 'ламс', 'шкала ламс', 'цвб', 'цереброваскулярное']
      },
      {
        name: 'Шкала оценки вероятности ТЭЛА',
        description: 'Женевская шкала',
        url: '/calculators/geneva-pe',
        category: 'Клинические состояния',
        keywords: ['тэла', 'геневская шкала', 'тромбоэмболия', 'легочная эмболия', 'geneva', 'тела', 'эмболия', 'легочная']
      },
      {
        name: 'Калькулятор срока беременности',
        description: 'Определение предполагаемой даты родов',
        url: '/calculators/pregnancy-due-date',
        category: 'Клинические состояния',
        keywords: ['беременность', 'роды', 'пдр', 'срок беременности', 'дата родов', 'гестация', 'срок', 'дата', 'родоразрешение', 'недель']
      },
      
      // Педиатрические
      {
        name: 'Физиологические возрастные нормы',
        description: 'Нормы ЧДД, ЧСС, АД у детей',
        url: '/calculators/pediatric-norms',
        category: 'Педиатрические',
        keywords: ['педиатрия', 'дети', 'нормы', 'чдд', 'чсс', 'ад', 'возрастные нормы', 'дыхание', 'пульс', 'давление', 'частота дыхания', 'частота сердцебиения']
      },
      {
        name: 'Детская шкала Глазго',
        description: 'Оценка сознания у детей до 1 года и 1-4 лет',
        url: '/calculators/gcs-pediatric',
        category: 'Педиатрические',
        keywords: ['детская глазго', 'дети глазго', 'педиатрия глазго', 'сознание детей']
      },
      {
        name: 'Шкала Апгар',
        description: 'Оценка состояния новорожденного',
        url: '/calculators/apgar',
        category: 'Педиатрические',
        keywords: ['апгар', 'новорожденный', 'оценка новорожденного', 'шкала апгар', 'атгар', 'атгар', 'ребенок', 'новорожденные']
      },
      {
        name: 'Шкала FLACC',
        description: 'Оценка боли у детей до 7 лет',
        url: '/calculators/flacc',
        category: 'Педиатрические',
        keywords: ['flacc', 'flack', 'флакк', 'оценка боли', 'боль у детей', 'педиатрия', 'дети', 'боль', 'оценка боли дети', 'поведенческая шкала']
      },
      {
        name: 'Шкала CIWA-AR',
        description: 'Тяжесть алкогольного абстинентного синдрома',
        url: '/calculators/ciwa-ar',
        category: 'Другие',
        keywords: ['ciwa', 'ciwa-ar', 'алкоголь', 'абстинентный синдром', 'али', 'алкоголизм', 'сива', 'сиваар', 'аддикция']
      },
      {
        name: 'ШОРС',
        description: 'Шкала оценки риска суицида',
        url: '/calculators/shors',
        category: 'Другие',
        keywords: ['шорс', 'suicide', 'суицид', 'риск', 'оценка риска', 'депрессия', 'суицидальный', 'suicidal', 'шкала суицида']
      }
      ,
      {
        name: 'Половая формула (Танер)',
        description: 'Ma/P/Ax/Me (девочки) и P/Ax/V (мальчики) по стадиям Танера.',
        url: '/calculators/sexual-formula',
        category: 'Педиатрические',
        keywords: ['танер', 'tanner', 'половая формула', 'puberty', 'ma', 'ax', 'p', 'v', 'менархе', 'pubic hair', 'genital stage']
      },
      {
        name: 'Шкала Westley Croup',
        description: 'Оценка тяжести крупа у детей по 5 признакам',
        url: '/calculators/westley-croup',
        category: 'Педиатрические',
        keywords: ['круп', 'westley', 'уэстли', 'stridor', 'цианоз', 'втяжение', 'дыхание', 'дети', 'laryngitis', 'tracheitis']
      }
      ,
      {
        name: 'Правило «девяток» (TBSA)',
        description: 'Оценка площади ожогов у взрослых по анатомическим зонам, кратным 9%.',
        url: '/calculators/rule-of-nines',
        category: 'Другие',
        keywords: ['ожог', 'правило девяток', 'tbsa', 'burns', 'rule of nines', 'ожоги', 'термические ожоги', 'площадь ожогов']
      }
    ]

    // Очищаем коллекцию перед вставкой
    await Calculator.deleteMany({})

    // Вставляем калькуляторы
    const result = await Calculator.insertMany(calculators)

    return {
      success: true,
      message: `Загружено калькуляторов: ${result.length}`,
      count: result.length
    }
  } catch (error: any) {
    console.error('Ошибка загрузки калькуляторов:', error)
    return {
      success: false,
      message: error.message
    }
  }
})

