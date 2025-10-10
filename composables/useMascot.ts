export interface MascotPhrase {
  text: string
  type: 'greeting' | 'help' | 'encouragement' | 'random'
  priority: number
}

export interface MascotConfig {
  autoSpeak: boolean
  followCursor: boolean
  blinkInterval: number
  speechInterval: number
  phrases: MascotPhrase[]
}

export const useMascot = () => {
  // Конфигурация по умолчанию
  const defaultConfig: MascotConfig = {
    autoSpeak: true,
    followCursor: true,
    blinkInterval: 3000,
    speechInterval: 30000,
    phrases: [
      { text: 'Привет! Я здесь, чтобы помочь! 😊', type: 'greeting', priority: 1 },
      { text: 'Нужна помощь с поиском?', type: 'help', priority: 2 },
      { text: 'Не стесняйтесь обращаться!', type: 'help', priority: 2 },
      { text: 'Я всегда готова помочь! 💙', type: 'help', priority: 1 },
      { text: 'Есть вопросы? Задавайте!', type: 'help', priority: 2 },
      { text: 'Рада видеть вас здесь!', type: 'greeting', priority: 2 },
      { text: 'Все будет хорошо! ✨', type: 'encouragement', priority: 1 },
      { text: 'Медицина - это важно!', type: 'random', priority: 3 },
      { text: 'Берегите себя! 💪', type: 'encouragement', priority: 2 },
      { text: 'Я рядом, если нужна помощь!', type: 'help', priority: 1 },
      { text: 'Как дела? Чем могу помочь?', type: 'greeting', priority: 2 },
      { text: 'Не забывайте о здоровье! 🏥', type: 'encouragement', priority: 2 },
      { text: 'Работаем вместе! 🤝', type: 'encouragement', priority: 1 },
      { text: 'Все получится! 💪', type: 'encouragement', priority: 1 },
      { text: 'Держитесь! Я с вами! 💙', type: 'encouragement', priority: 1 }
    ]
  }

  // Реактивные данные
  const config = ref<MascotConfig>({ ...defaultConfig })
  const isVisible = ref(true)
  const isActive = ref(false)
  const currentPhrase = ref('')
  const lastInteraction = ref<Date | null>(null)

  // Статистика
  const stats = ref({
    totalInteractions: 0,
    phrasesShown: 0,
    clicks: 0,
    hovers: 0,
    lastActivity: ''
  })

  // Методы
  const updateConfig = (newConfig: Partial<MascotConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  const showPhrase = (phrase: string, duration = 4000) => {
    if (currentPhrase.value) return false
    
    currentPhrase.value = phrase
    stats.value.phrasesShown++
    stats.value.lastActivity = `Фраза: "${phrase}" в ${new Date().toLocaleTimeString()}`
    
    setTimeout(() => {
      currentPhrase.value = ''
    }, duration)
    
    return true
  }

  const speakRandomPhrase = (type?: MascotPhrase['type']) => {
    const availablePhrases = type 
      ? config.value.phrases.filter(p => p.type === type)
      : config.value.phrases
    
    if (availablePhrases.length === 0) return false
    
    // Сортируем по приоритету (меньше число = выше приоритет)
    const sortedPhrases = availablePhrases.sort((a, b) => a.priority - b.priority)
    const randomPhrase = sortedPhrases[Math.floor(Math.random() * Math.min(3, sortedPhrases.length))]
    
    return showPhrase(randomPhrase.text)
  }

  const speakGreeting = () => {
    return speakRandomPhrase('greeting')
  }

  const speakHelp = () => {
    return speakRandomPhrase('help')
  }

  const speakEncouragement = () => {
    return speakRandomPhrase('encouragement')
  }

  const recordInteraction = (type: 'click' | 'hover') => {
    stats.value.totalInteractions++
    stats.value[type === 'click' ? 'clicks' : 'hovers']++
    lastInteraction.value = new Date()
    stats.value.lastActivity = `${type === 'click' ? 'Клик' : 'Наведение'} в ${new Date().toLocaleTimeString()}`
  }

  const showActivity = () => {
    isActive.value = true
    setTimeout(() => {
      isActive.value = false
    }, 2000)
  }

  const hide = () => {
    isVisible.value = false
  }

  const show = () => {
    isVisible.value = true
  }

  const toggle = () => {
    isVisible.value = !isVisible.value
  }

  const resetStats = () => {
    stats.value = {
      totalInteractions: 0,
      phrasesShown: 0,
      clicks: 0,
      hovers: 0,
      lastActivity: ''
    }
  }

  // Автоматические реплики
  const startAutoSpeak = () => {
    if (!config.value.autoSpeak) return
    
    const scheduleNext = () => {
      const intervals = [15000, 25000, 35000, 45000] // 15-45 секунд
      const randomInterval = intervals[Math.floor(Math.random() * intervals.length)]
      
      setTimeout(() => {
        if (!currentPhrase.value && isVisible.value) {
          speakRandomPhrase()
        }
        scheduleNext()
      }, randomInterval)
    }
    
    // Первая реплика через 5 секунд
    setTimeout(() => {
      if (isVisible.value) {
        speakGreeting()
      }
      scheduleNext()
    }, 5000)
  }

  // Инициализация
  const init = () => {
    startAutoSpeak()
  }

  return {
    // Состояние
    config: readonly(config),
    isVisible: readonly(isVisible),
    isActive: readonly(isActive),
    currentPhrase: readonly(currentPhrase),
    lastInteraction: readonly(lastInteraction),
    stats: readonly(stats),
    
    // Методы
    updateConfig,
    showPhrase,
    speakRandomPhrase,
    speakGreeting,
    speakHelp,
    speakEncouragement,
    recordInteraction,
    showActivity,
    hide,
    show,
    toggle,
    resetStats,
    init
  }
}

