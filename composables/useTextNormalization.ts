// Функция для нормализации текста (приведение кириллицы и латиницы к единому виду)
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

// Функция для проверки совпадения с учетом нормализации
export function matchesNormalized(searchText: string, targetText: string): boolean {
  if (!searchText || !targetText) return false
  
  const normalizedSearch = normalizeText(searchText)
  const normalizedTarget = normalizeText(targetText)
  
  // Проверяем прямое совпадение нормализованных текстов
  if (normalizedTarget.includes(normalizedSearch)) {
    return true
  }
  
  // Также проверяем оригинальные тексты (fallback)
  const originalSearch = searchText.toLowerCase()
  const originalTarget = targetText.toLowerCase()
  
  return originalTarget.includes(originalSearch)
}

// Composable для использования в компонентах
export function useTextNormalization() {
  return {
    normalizeText,
    matchesNormalized
  }
}
