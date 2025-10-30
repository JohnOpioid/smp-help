export const useCalculatorBookmarks = () => {
  const userBookmarks = ref<any[]>([])
  const isBookmarked = ref(false)

  // Метаданные калькуляторов
  const calculatorMetadata: Record<string, {
    title: string
    description: string
    category: string
  }> = {
    'four': {
      title: 'Шкала FOUR',
      description: 'Шкала комы FOUR служит для градации глубины комы у интубированных больных, когда оценка речевой реакции по GCS невозможна.',
      category: 'Калькуляторы'
    },
    'rass': {
      title: 'Шкала RASS',
      description: 'Шкала RASS (шкала возбуждения-седации Ричмонда, Richmond Agitation–Sedation Scale) используется в реанимации и ИТ для оценки возбуждения или глубины седации.',
      category: 'Калькуляторы'
    },
    'shoks': {
      title: 'Шкала ШОКС',
      description: 'ШОКС — шкала оценки клинического состояния пациента с хронической сердечной недостаточностью (ХСН). Основана на сумме 10 признаков, по результату определяется функциональный класс.',
      category: 'Калькуляторы'
    },
    'news': {
      title: 'Шкала NEWS',
      description: 'Шкала NEWS (National Early Warning Score) используется для раннего выявления ухудшения состояния пациента.',
      category: 'Калькуляторы'
    },
    'pain-vas': {
      title: 'Шкала боли VAS',
      description: 'Визуальная аналоговая шкала (VAS) для оценки интенсивности боли.',
      category: 'Калькуляторы'
    },
    'lams': {
      title: 'Шкала LAMS',
      description: 'Шкала LAMS (Los Angeles Motor Scale) для оценки тяжести инсульта.',
      category: 'Калькуляторы'
    },
    'geneva-pe': {
      title: 'Женевская шкала ТЭЛА',
      description: 'Женевская шкала для оценки вероятности тромбоэмболии легочной артерии (ТЭЛА).',
      category: 'Калькуляторы'
    },
    'pregnancy-due-date': {
      title: 'Калькулятор даты родов',
      description: 'Калькулятор для определения предполагаемой даты родов.',
      category: 'Калькуляторы'
    },
    'pediatric-norms': {
      title: 'Педиатрические нормы',
      description: 'Калькулятор для расчета педиатрических норм и показателей.',
      category: 'Калькуляторы'
    },
    'gcs-pediatric': {
      title: 'Шкала комы Глазго (детская)',
      description: 'Детская версия шкалы комы Глазго (GCS) для оценки степени нарушения сознания у детей.',
      category: 'Калькуляторы'
    },
    'apgar': {
      title: 'Шкала Апгар',
      description: 'Шкала Апгар для оценки состояния новорожденного в первые минуты жизни.',
      category: 'Калькуляторы'
    },
    'gcs': {
      title: 'Шкала комы Глазго (GCS)',
      description: 'Шкала комы Глазго (Glasgow Coma Scale, GCS) используется для оценки степени нарушения сознания у взрослых.',
      category: 'Калькуляторы'
    },
    'flacc': {
      title: 'Шкала FLACC',
      description: 'Поведенческая шкала оценки боли у младенцев и детей до 7 лет. Учитывает выражение лица, положение ног, активность, плач и реакцию на успокоение.',
      category: 'Калькуляторы'
    },
    'ciwa-ar': {
      title: 'Шкала CIWA-AR',
      description: 'Шкала тяжести алкогольного абстинентного синдрома. Используется для определения симптомов алкогольного абстинентного синдрома и его степени тяжести.',
      category: 'Калькуляторы'
    }
    ,
    'shors': {
      title: 'ШОРС',
      description: 'Шкала оценки риска суицида. 10 бинарных факторов, суммарный риск и рекомендации.',
      category: 'Калькуляторы'
    }
    ,
    'rule-of-nines': {
      title: 'Правило «девяток» (TBSA)',
      description: 'Быстрая оценка площади ожогов у взрослых по анатомическим зонам, кратным 9%.',
      category: 'Другие'
    },
    'burn-area': {
      title: 'Площадь ожоговой поверхности',
      description: 'Определение площади ожогов (правило ладони и правило девяток).',
      category: 'Клинические состояния'
    }
  }

  async function loadBookmarks() {
    try {
      const res: any = await $fetch('/api/bookmarks')
      if (res?.success) {
        userBookmarks.value = res.items || []
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    }
  }

  function buildCalculatorUrl(calculatorId: string) {
    return `/calculators/${calculatorId}`
  }

  function updateIsBookmarked(calculatorId: string) {
    if (userBookmarks.value.length === 0) {
      loadBookmarks()
      return
    }
    const targetUrl = buildCalculatorUrl(calculatorId)
    isBookmarked.value = userBookmarks.value.some((b: any) => b.url === targetUrl)
  }

  async function addBookmark(calculatorId: string) {
    try {
      const metadata = calculatorMetadata[calculatorId]
      if (!metadata) {
        throw new Error(`Unknown calculator: ${calculatorId}`)
      }

      const response = await $fetch('/api/bookmarks', {
        method: 'POST',
        body: {
          type: 'calculator',
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          url: buildCalculatorUrl(calculatorId)
        }
      })
      
      if (response.success) {
        isBookmarked.value = true
        await loadBookmarks()
        // @ts-ignore
        const toast = useToast?.()
        toast?.add?.({ title: 'Добавлено в закладки', color: 'primary' })
        
        // Уведомляем другие компоненты об обновлении закладок
        window.dispatchEvent(new CustomEvent('bookmarks-updated'))
      } else {
        console.error('Failed to add bookmark:', response.message)
        // @ts-ignore
        const toast = useToast?.()
        toast?.add?.({ title: response.message || 'Не удалось добавить в закладки', color: 'error' })
      }
    } catch (e) {
      console.error('Error adding bookmark:', e)
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Не удалось добавить в закладки', color: 'error' })
    }
  }

  async function removeBookmark(calculatorId: string) {
    try {
      const targetUrl = buildCalculatorUrl(calculatorId)
      if (userBookmarks.value.length === 0) await loadBookmarks()

      const bm = userBookmarks.value.find((b: any) => b.url === targetUrl)
      if (!bm?._id) return

      await $fetch(`/api/bookmarks/${bm._id}`, { method: 'DELETE' })
      isBookmarked.value = false
      await loadBookmarks()
      
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Удалено из закладок', color: 'neutral' })
      
      // Уведомляем другие компоненты об обновлении закладок
      window.dispatchEvent(new CustomEvent('bookmarks-updated'))
    } catch (e) {
      console.error('Error removing bookmark:', e)
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Не удалось удалить из закладок', color: 'error' })
    }
  }

  async function toggleBookmark(calculatorId: string) {
    if (isBookmarked.value) {
      await removeBookmark(calculatorId)
    } else {
      await addBookmark(calculatorId)
    }
  }

  return {
    userBookmarks,
    isBookmarked,
    loadBookmarks,
    updateIsBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    buildCalculatorUrl
  }
}
