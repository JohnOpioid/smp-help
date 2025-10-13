/**
 * Упрощенные правила индексации для улучшения поиска по базе данных СМП
 * Добавляет только основные синонимы для более точного поиска
 */

export interface SearchIndexingRules {
  [key: string]: string[]
}

// Основные правила индексации по ключевым словам
export const SEARCH_INDEXING_RULES: SearchIndexingRules = {
  // Травмы
  'травма': ['повреждение', 'ушиб', 'перелом', 'вывих'],
  'перелом': ['сломанная кость', 'трещина'],
  'вывих': ['смещение', 'подвывих'],
  'ушиб': ['контузия', 'гематома'],

  // Сердечно-сосудистые
  'сердце': ['кардио', 'миокард', 'сердечный'],
  'инфаркт': ['инфаркт миокарда', 'ИМ', 'ОКС'],
  'инсульт': ['ОНМК', 'цереброваскулярная болезнь'],
  'гипертония': ['артериальная гипертензия', 'АГ'],

  // Дыхательная система
  'легкие': ['легочный', 'пневмония', 'бронхит', 'астма'],
  'астма': ['бронхиальная астма', 'БА'],
  'пневмония': ['воспаление легких', 'легочная инфекция'],

  // Неврология
  'головная боль': ['цефалгия', 'мигрень'],
  'судороги': ['конвульсии', 'эпилепсия', 'припадок'],
  'паралич': ['парез', 'парализация'],

  // Желудочно-кишечный тракт
  'желудок': ['гастрит', 'язва', 'желудочный'],
  'кишечник': ['кишечная непроходимость', 'энтерит', 'колит'],
  'печень': ['гепатит', 'цирроз', 'печеночная недостаточность'],

  // Эндокринология
  'диабет': ['сахарный диабет', 'СД'],
  'щитовидная': ['тиреоид', 'гипотиреоз', 'гипертиреоз'],

  // Аллергия
  'аллергия': ['аллергическая реакция', 'анафилаксия'],
  'анафилаксия': ['анафилактический шок'],

  // Инфекции
  'инфекция': ['заражение', 'сепсис'],
  'сепсис': ['септический шок', 'заражение крови'],

  // Анатомические области
  'глаз': ['офтальмология', 'зрение', 'роговица'],
  'ухо': ['отоларингология', 'ЛОР', 'слух'],
  'нос': ['ринит', 'синусит'],
  'горло': ['фарингит', 'ларингит', 'тонзиллит'],
  'зуб': ['стоматология', 'кариес', 'пульпит'],

  // Препараты
  'обезболивающее': ['анальгетик', 'болеутоляющее'],
  'антибиотик': ['антибактериальный', 'противомикробный'],
  'противовоспалительное': ['НПВС', 'противовоспалительный'],

  // Неотложные состояния
  'шок': ['шоковое состояние', 'коллапс'],
  'кровотечение': ['геморрагия', 'кровопотеря'],
  'отравление': ['интоксикация', 'токсикоз'],

  // Возрастные группы
  'детский': ['педиатрия', 'ребенок', 'дети'],
  'взрослый': ['взрослый возраст', 'взрослые'],
  'пожилой': ['геронтология', 'пожилой возраст'],

  // Специальности
  'травматология': ['травматолог', 'ортопедия'],
  'хирургия': ['хирургический', 'оперативное лечение'],
  'терапия': ['терапевтический', 'консервативное лечение']
}

/**
 * Получает дополнительные поисковые термины для заданного текста
 * @param text - исходный текст для анализа
 * @returns массив дополнительных поисковых терминов
 */
export function getSearchTerms(text: string): string[] {
  if (!text) return []
  
  const textLower = text.toLowerCase()
  const additionalTerms: string[] = []
  
  // Ищем ключевые слова в тексте и добавляем связанные термины
  Object.entries(SEARCH_INDEXING_RULES).forEach(([keyword, synonyms]) => {
    if (textLower.includes(keyword)) {
      additionalTerms.push(...synonyms)
    }
  })
  
  // Добавляем отдельные слова из названия для лучшего поиска (только длинные слова)
  const words = textLower.split(/[\s,;.()]+/).filter(word => 
    word.length > 3 && 
    !['для', 'при', 'от', 'до', 'над', 'под', 'через', 'между', 'среди', 'внутри', 'внешний'].includes(word)
  )
  additionalTerms.push(...words)
  
  // Убираем дубликаты и возвращаем
  return [...new Set(additionalTerms)]
}

/**
 * Создает расширенный поисковый текст для элемента
 * @param item - элемент данных
 * @param baseFields - базовые поля для поиска
 * @returns расширенный поисковый текст
 */
export function createSearchText(item: any, baseFields: string[]): string {
  const baseText = baseFields
    .map(field => {
      const value = item[field]
      if (Array.isArray(value)) return value.join(' ')
      return value || ''
    })
    .filter(Boolean)
    .join(' ')
  
  const additionalTerms = getSearchTerms(baseText)
  
  return [baseText, ...additionalTerms].filter(Boolean).join(' ')
}

/**
 * Правила индексации для конкретных типов данных
 */
export const DATA_TYPE_RULES = {
  // МКБ коды
  mkb: (item: any) => createSearchText(item, [
    'name', 'note', 'mkbCode', 'stationCode', 'category.name'
  ]),
  
  // Локальные статусы
  localStatus: (item: any) => createSearchText(item, [
    'name', 'description', 'note', 'code', 'stationCode', 'category.name'
  ]),
  
  // Алгоритмы
  algorithm: (item: any) => {
    const baseFields = ['title', 'category.name', 'section']
    const content = String(item.content || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#>*_`\-]+/g, ' ')
      .replace(/\[.*?\]\(.*?\)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    return createSearchText({ ...item, content }, [...baseFields, 'content'])
  },
  
  // Препараты
  drug: (item: any) => {
    const formText = item.forms ? 
      `${item.forms.doseValue || ''} ${item.forms.doseUnit || ''} ${item.forms.volumeMl ? `• ${item.forms.volumeMl} мл` : ''}`.trim() : ''
    
    return createSearchText(item, [
      'name', 'latinName', 'description', 'synonyms', formText
    ])
  },
  
  // Инструкции
  instruction: (item: any) => createSearchText(item, [
    'title', 'description'
  ]),
  
  // Подстанции
  substation: (item: any) => {
    const phones = Array.isArray(item.phones) ? item.phones.join(', ') : (item.phone || '')
    const regionName = item.region?.name || item.regionName || ''
    
    return createSearchText(item, [
      'name', 'address', phones, regionName
    ])
  }
}