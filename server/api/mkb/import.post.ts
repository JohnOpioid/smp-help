import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import { requireAdmin } from '~/server/utils/auth'
import MKB from '~/server/models/MKB'
import MKBCategory from '~/server/models/MKBCategory'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type MkbJsonItem = {
  codeStation: number
  codeMkb: string
  description: string
  additional?: string
  class: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const jsonPath = resolve(process.cwd(), 'public', 'mkb.json')
  const raw = await readFile(jsonPath, 'utf-8')
  let data = JSON.parse(raw) as MkbJsonItem[]

  // Ремап классов по новой договоренности:
  // - то, что в файле помечено cl22 → считаем как cl23 ("Коды для особых целей")
  // - то, что помечено clUnresult → считаем как cl22 ("Безрезультатные вызовы")
  data = data.map((item) => ({
    ...item,
    class: item.class === 'cl22' ? 'cl23' : (item.class === 'clUnresult' ? 'cl22' : item.class)
  }))

  // Собираем все коды классов из файла
  const classCodes = Array.from(new Set(data.map(d => String(d.class).trim()).filter(Boolean)))

  // Находим категории с назначенными классами
  const categories = await MKBCategory.find({ class: { $in: classCodes } }).select('_id name class').lean()
  const classToCategoryId = new Map<string, string>()
  categories.forEach((c: any) => { if (c.class) classToCategoryId.set(String(c.class), String(c._id)) })

  // Проверяем, что для всех классов есть категория
  const missing = classCodes.filter(c => !classToCategoryId.has(c))
  if (missing.length > 0) {
    return {
      success: false,
      message: 'Не найдены категории для некоторых классов. Назначьте class в коллекции categories.',
      missingClasses: missing
    }
  }

  // Чистим коллекцию MKB перед импортом
  await MKB.deleteMany({})

  // Готовим документы к вставке (с учётом переназначения классов и ручных правил)
  const docs = data.map(item => {
    const rawClass = String(item.class).trim()
    // Ручное правило: станции 1890, 1950, 1951 всегда относятся к cl22 (Безрезультатные вызовы)
    const forceCl22 = item.codeStation === 1890 || item.codeStation === 1950 || item.codeStation === 1951
    let mappedClass = rawClass === 'cl22' ? 'cl23' : (rawClass === 'clUnresult' ? 'cl22' : rawClass)
    if (forceCl22) mappedClass = 'cl22'
    return {
      category: classToCategoryId.get(mappedClass)!,
    stationCode: String(item.codeStation),
    mkbCode: String(item.codeMkb),
    name: String(item.description || '').trim(),
    note: String(item.additional || '').trim() || undefined
    }
  })

  // Вставляем пачкой
  await MKB.insertMany(docs, { ordered: false })

  return { success: true, inserted: docs.length }
})


