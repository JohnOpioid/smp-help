import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import { requireAdmin } from '~/server/utils/auth'
import MKB from '~/server/models/MKB'
import Category from '~/server/models/Category'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type MkbJsonItem = {
  codeStation: number
  codeMkb: string
  description: string
  additional?: string
  class: string
}

function classOrder(a: string, b: string) {
  const na = parseInt(a.replace(/\D+/g, '') || '0', 10)
  const nb = parseInt(b.replace(/\D+/g, '') || '0', 10)
  return na - nb
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const jsonPath = resolve(process.cwd(), 'public', 'mkb.json')
  const raw = await readFile(jsonPath, 'utf-8')
  const data = JSON.parse(raw) as MkbJsonItem[]

  // Собираем и сортируем коды классов по числу: cl1, cl2, ...
  const classCodes = Array.from(new Set(data.map(d => String(d.class).trim()).filter(Boolean)))
    .sort(classOrder)

  // Получаем категории в порядке создания (по возрастанию)
  const categories = await Category.find({}).sort({ createdAt: 1 }).select('_id name class').lean()

  if (categories.length < classCodes.length) {
    return {
      success: false,
      message: `Недостаточно категорий: нужно ${classCodes.length}, найдено ${categories.length}`
    }
  }

  // Назначаем класс кодам по порядку
  const updates = classCodes.map((cls, idx) => ({ id: String(categories[idx]._id), cls }))

  // Проверим на конфликты с уже назначенными классами у других категорий
  const existingByClass = new Map<string, string>()
  const existingWithClass = await Category.find({ class: { $ne: null } }).select('_id class').lean()
  existingWithClass.forEach((c: any) => existingByClass.set(String(c.class), String(c._id)))

  // Подготовим bulk операции: снимаем у конфликтующих и ставим у нужных
  const bulkOps: any[] = []
  for (const u of updates) {
    const conflictId = existingByClass.get(u.cls)
    if (conflictId && conflictId !== u.id) {
      bulkOps.push({ updateOne: { filter: { _id: conflictId }, update: { $unset: { class: 1 } } } })
    }
    bulkOps.push({ updateOne: { filter: { _id: u.id }, update: { $set: { class: u.cls } } } })
  }
  if (bulkOps.length > 0) {
    await Category.bulkWrite(bulkOps)
  }

  // Сформируем карту class -> categoryId после обновления
  const refreshed = await Category.find({ class: { $in: classCodes } }).select('_id class').lean()
  const classToCategoryId = new Map<string, string>()
  refreshed.forEach((c: any) => { if (c.class) classToCategoryId.set(String(c.class), String(c._id)) })

  // Чистим коллекцию МКБ
  await MKB.deleteMany({})

  // Готовим документы к вставке
  const docs = data.map(item => ({
    category: classToCategoryId.get(String(item.class).trim())!,
    stationCode: String(item.codeStation),
    mkbCode: String(item.codeMkb),
    name: String(item.description || '').trim(),
    note: String(item.additional || '').trim() || undefined
  }))

  await MKB.insertMany(docs, { ordered: false })

  return { success: true, mappedClasses: classCodes.length, inserted: docs.length }
})


