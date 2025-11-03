// Серверная функция для нормализации текста (приведение кириллицы и латиницы к единому виду)
export function normalizeText(text: string): string {
  if (!text) return ''
  
  // Создаем единый маппинг для всех символов (по внешнему виду)
  const charMap: { [key: string]: string } = {
    // Кириллица -> Латиница (по внешнему виду)
    'а': 'a', 'б': 'b', 'в': 'b', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'h', 'о': 'o', 'п': 'p', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y',
    'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    
    // Заглавная кириллица -> Заглавная латиница (по внешнему виду)
    'А': 'A', 'Б': 'B', 'В': 'B', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
    'Ж': 'ZH', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'H', 'О': 'O', 'П': 'P', 'Р': 'P', 'С': 'C', 'Т': 'T', 'У': 'Y',
    'Ф': 'F', 'Х': 'X', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA',
    
    // Латиница -> Кириллица (обратный маппинг)
    'a': 'а', 'b': 'б', 'g': 'г', 'd': 'д', 'e': 'е', 'zh': 'ж',
    'z': 'з', 'i': 'и', 'y': 'й', 'k': 'к', 'l': 'л', 'm': 'м',
    'h': 'н', 'o': 'о', 'p': 'п', 'c': 'с', 't': 'т', 'f': 'ф',
    'x': 'х', 'ts': 'ц', 'ch': 'ч', 'sh': 'ш', 'sch': 'щ', 'yu': 'ю', 'ya': 'я',
    
    // Заглавная латиница -> Заглавная кириллица (обратный маппинг)
    'A': 'А', 'B': 'Б', 'G': 'Г', 'D': 'Д', 'E': 'Е', 'ZH': 'Ж',
    'Z': 'З', 'I': 'И', 'Y': 'Й', 'K': 'К', 'L': 'Л', 'M': 'М',
    'H': 'Н', 'O': 'О', 'P': 'П', 'C': 'С', 'T': 'Т', 'F': 'Ф',
    'X': 'Х', 'TS': 'Ц', 'CH': 'Ч', 'SH': 'Ш', 'SCH': 'Щ', 'YU': 'Ю', 'YA': 'Я'
  }
  
  let result = text.toLowerCase()
  
  // Применяем все замены
  for (const [from, to] of Object.entries(charMap)) {
    if (to) {
      result = result.replace(new RegExp(from, 'g'), to)
    }
  }
  
  return result
}

// Односторонняя транслитерация (Кириллица -> Латиница) для формирования URL-слугов
export function transliterateCyrToLat(text: string): string {
  if (!text) return ''
  const map: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'E','Ж':'Zh','З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'H','Ц':'C','Ч':'Ch','Ш':'Sh','Щ':'Sch','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya'
  }
  let result = ''
  for (const ch of text) {
    result += map[ch] ?? ch
  }
  return result
}

export function slugifyForUrl(text: string): string {
  const translit = transliterateCyrToLat(String(text).trim())
  return translit
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$|_/g, '')
}

// Функция для создания regex паттерна, который матчит похожие кириллические и латинские буквы
export function createCyrillicLatinRegex(pattern: string): string {
  if (!pattern) return pattern
  
  // Маппинг похожих букв (кириллица <-> латиница)
  const similarChars: { [key: string]: string } = {
    // Одинаковые по виду
    'О': '[ОO]', 'о': '[оo]',
    'Р': '[РP]', 'р': '[рp]',
    'Т': '[ТT]', 'т': '[тt]',
    'С': '[СC]', 'с': '[сc]',
    'Н': '[НH]', 'н': '[нh]',
    'А': '[АA]', 'а': '[аa]',
    'В': '[ВB]', 'в': '[вb]',
    'Е': '[ЕE]', 'е': '[еe]',
    'К': '[КK]', 'к': '[кk]',
    'М': '[МM]', 'м': '[мm]',
    'Х': '[ХX]', 'х': '[хx]',
    'У': '[УY]', 'у': '[уy]',
    'И': '[ИI]', 'и': '[иi]',
    'З': '[ЗZ]', 'з': '[зz]',
    'Г': '[ГG]', 'г': '[гg]',
    'Д': '[ДD]', 'д': '[дd]',
    'Л': '[ЛL]', 'л': '[лl]',
    'П': '[ПP]', 'п': '[пp]',
    'Ф': '[ФF]', 'ф': '[фf]',
  }
  
  let result = ''
  
  // Обрабатываем каждый символ отдельно
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i]
    
    // Если это похожий символ, заменяем на группу
    if (similarChars[char]) {
      result += similarChars[char]
    } else {
      // Экранируем специальные символы regex
      result += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
  }
  
  return result
}

// Функция для создания MongoDB поисковых условий с учетом нормализации
export function createNormalizedSearchConditions(search: string, fields: string[]) {
  if (!search.trim()) return {}
  
  const normalizedSearch = normalizeText(search.trim())
  const originalSearch = search.trim().toLowerCase()
  
  const orConditions: any[] = []
  
  // Для каждого поля создаем условия поиска
  fields.forEach(field => {
    // Добавляем поиск по нормализованному тексту
    if (normalizedSearch) {
      const regex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      orConditions.push({ [field]: regex })
    }
    
    // Также добавляем поиск по оригинальному тексту
    if (originalSearch) {
      const regex = new RegExp(originalSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      orConditions.push({ [field]: regex })
    }
  })
  
  return orConditions.length > 0 ? { $or: orConditions } : {}
}
