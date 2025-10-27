// Скрипт для загрузки калькуляторов в БД
const mongoose = require('mongoose')

// Данные калькуляторов
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
    keywords: ['four', 'шкала four', 'интубированные', 'кома', 'сознание', '4', 'шкала 4', 'фоур']
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
  }
]

async function seedCalculators() {
  try {
    // Подключение к MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smp-help'
    await mongoose.connect(mongoUri)
    console.log('✅ Подключено к MongoDB')

    // Импортируем модель (нужно скопировать из server/models/Calculator.ts)
    const CalculatorSchema = new mongoose.Schema({
      name: { type: String, required: true, trim: true },
      description: { type: String, required: false, trim: true },
      url: { type: String, required: true, trim: true },
      category: { type: String, required: true, trim: true },
      keywords: [{ type: String, trim: true }]
    }, { timestamps: true })

    const Calculator = mongoose.models.Calculator || mongoose.model('Calculator', CalculatorSchema)

    // Очищаем коллекцию
    await Calculator.deleteMany({})
    console.log('✅ Очищена коллекция калькуляторов')

    // Вставляем калькуляторы
    const result = await Calculator.insertMany(calculators)
    console.log(`✅ Загружено калькуляторов: ${result.length}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Ошибка:', error)
    process.exit(1)
  }
}

seedCalculators()

