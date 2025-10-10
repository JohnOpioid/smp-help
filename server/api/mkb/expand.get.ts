import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'

export default defineEventHandler(async (event) => {
  await connectDB()
  const { range } = getQuery(event) as { range?: string }
  const raw = (range || '').toString().trim().toUpperCase()
  if (!raw) return { success: false, message: 'range is required', mkbCodes: [] }

  // Нормализуем разделитель
  const sep = raw.includes('–') ? '–' : (raw.includes('-') ? '-' : null)

  // Вспомогательная: получить все коды по префиксному шаблону, например A00
  async function fetchByPrefix(prefix: string) {
    const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\.|$)')
    const docs = await MKB.find({ mkbCode: { $regex: re } }, { mkbCode: 1, _id: 0 }).lean()
    return docs.map((d: any) => d.mkbCode)
  }

  // Случай одиночного кода (без разделителя) → вернём сам код, если он существует
  if (!sep) {
    const one = await MKB.findOne({ mkbCode: raw }, { mkbCode: 1 }).lean()
    return { success: true, mkbCodes: one ? [one.mkbCode] : [] }
  }

  const [startRaw, endRaw] = raw.split(sep).map(s => s.trim())
  if (!startRaw) return { success: false, message: 'invalid range', mkbCodes: [] }

  // Парсим букву и номер, допускаем формы A00 или A00.1 (используем только целую часть)
  const startMatch = startRaw.match(/^([A-Z])(\d{2})/)
  if (!startMatch) return { success: false, message: 'invalid start code', mkbCodes: [] }
  const startLetter = startMatch[1]
  const startNum = parseInt(startMatch[2])

  // Если конец отсутствует (A00 -), берём все под-коды данной категории
  if (!endRaw) {
    const prefix = `${startLetter}${String(startNum).padStart(2, '0')}`
    const list = await fetchByPrefix(prefix)
    return { success: true, mkbCodes: list }
  }

  const endMatch = endRaw.match(/^([A-Z])?(\d{2})/)
  if (!endMatch) return { success: false, message: 'invalid end code', mkbCodes: [] }
  const endLetter = (endMatch[1] || startLetter)
  const endNum = parseInt(endMatch[2])
  if (startLetter !== endLetter) return { success: false, message: 'different letters in range', mkbCodes: [] }

  const mkbSet = new Set<string>()
  const from = Math.min(startNum, endNum)
  const to = Math.max(startNum, endNum)
  for (let n = from; n <= to; n++) {
    const prefix = `${startLetter}${String(n).padStart(2, '0')}`
    const list = await fetchByPrefix(prefix)
    for (const c of list) mkbSet.add(c)
  }
  return { success: true, mkbCodes: Array.from(mkbSet) }
})


