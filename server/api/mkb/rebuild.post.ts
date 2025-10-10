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

  // 1) Читаем файл mkb.json
  const jsonPath = resolve(process.cwd(), 'public', 'mkb.json')
  const raw = await readFile(jsonPath, 'utf-8')
  const data = JSON.parse(raw) as MkbJsonItem[]

  // 2) Вытаскиваем уникальные классы и сортируем по номеру
  const classCodes = Array.from(new Set(data.map(d => String(d.class).trim()).filter(Boolean)))
    .sort((a, b) => parseInt(a.replace(/\D+/g, '') || '0', 10) - parseInt(b.replace(/\D+/g, '') || '0', 10))

  // 3) Пытаемся получить список категорий из старой коллекции mkbs_Old
  // Ожидается структура документов: { categoryName: string } или { category: { name } }
  const db = (await import('mongoose')).default.connection
  const old = await db.collection('mkbs_Old').find({}).project({ categoryName: 1, category: 1 }).toArray()
  const uniqueOldNames = Array.from(new Set(old.map((o: any) => (o.categoryName || o.category?.name || '').toString().trim()).filter(Boolean)))

  // 4) Создаем/пересоздаем категории для МКБ, маппим коды классов по порядку на названия из mkbs_Old
  await MKBCategory.deleteMany({})
  const mkbCategories = [] as any[]
  for (let i = 0; i < classCodes.length; i++) {
    const cls = classCodes[i]
    const fallbackName = `Класс ${cls}`
    const name = uniqueOldNames[i] || fallbackName
    mkbCategories.push({ name, class: cls })
  }
  // Вставка с автогенерацией url через pre-save hook невозможна через insertMany без runValidators:true и setter'ов,
  // поэтому создадим по одному (упрощенно и надёжно)
  const created: any[] = []
  for (const c of mkbCategories) {
    const doc = new MKBCategory(c)
    await doc.save()
    created.push(doc.toObject())
  }

  const classToCategoryId = new Map<string, string>()
  for (const c of created) {
    classToCategoryId.set(String(c.class), String(c._id))
  }

  // 5) Чистим mkbs и импортируем из файла
  await MKB.deleteMany({})

  const docs = data.map(item => ({
    category: classToCategoryId.get(String(item.class).trim())!,
    stationCode: String(item.codeStation),
    mkbCode: String(item.codeMkb),
    name: String(item.description || '').trim(),
    note: String(item.additional || '').trim() || undefined
  }))

  await MKB.insertMany(docs, { ordered: false })

  return { success: true, categoriesCreated: created.length, mkbsInserted: docs.length }
})


