import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import { requireAdmin } from '~/server/utils/auth'
import MKBCategory from '~/server/models/MKBCategory'
import { slugifyForUrl } from '~/server/utils/textNormalization'
import MKB from '~/server/models/MKB'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

function toClassCode(index: number) {
  return `cl${index + 1}`
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const xlsxPath = resolve(process.cwd(), 'public', 'МКБ Кодификатор.xlsx')
  const mkbJsonPath = resolve(process.cwd(), 'public', 'mkb.json')

  let xlsx: any
  try {
    const require = createRequire(import.meta.url)
    xlsx = require('xlsx')
  } catch (e) {
    return { success: false, message: 'Не установлен пакет xlsx. Установите: npm i xlsx' }
  }

  // 1) Читаем XLSX в буфер
  let workbook: any
  try {
    const buf = await readFile(xlsxPath)
    workbook = xlsx.read(buf, { type: 'buffer' })
  } catch (e: any) {
    return { success: false, message: `Не удалось прочитать файл: ${xlsxPath}`, error: String(e?.message || e) }
  }

  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false })

  // 2) Определяем индекс колонки Podkategory по заголовку
  const header = Array.isArray(rows[0]) ? rows[0] : []
  const podkategoryIdx = header.findIndex((h: any) => String(h || '').trim().toLowerCase() === 'podkategory')
  if (podkategoryIdx === -1) {
    return { success: false, message: 'В XLSX не найдена колонка Podkategory (в первой строке заголовков)' }
  }

  // 3) Забираем названия категорий из колонки Podkategory
  const names = rows
    .slice(1)
    .map(r => (Array.isArray(r) ? String(r[podkategoryIdx] || '').trim() : ''))
    .filter(v => !!v)

  // Уберём повторы, сохраняя порядок
  const seen = new Set<string>()
  const uniqueNames: string[] = []
  for (const n of names) {
    // 3a) Чистим названия: убираем римские цифры с точкой в начале (I., II., ...)
    const cleaned = n.replace(/^[IVXLCDM]+\.\s*/i, '').replace(/\s+/g, ' ').trim()
    if (!seen.has(cleaned)) {
      seen.add(cleaned)
      uniqueNames.push(cleaned)
    }
  }

  // 4) Из mkb.json собираем классы и сортируем по номеру (cl1, cl2, ...)
  const mkbRaw = await readFile(mkbJsonPath, 'utf-8')
  const mkbData = JSON.parse(mkbRaw) as Array<{ class: string } & any>
  const classSet = new Set(
    mkbData.map(d => String(d.class || '').trim()).filter(Boolean)
  )
  // Жёсткий порядок сопоставления: cl1..cl22, затем clUnresult (если присутствуют в mkb.json)
  // Новый порядок и набор классов с учётом требований:
  // cl1..cl21 как есть, cl22 — Безрезультатные вызовы, cl23 — Коды для особых целей
  const ordered = [
    'cl1','cl2','cl3','cl4','cl5','cl6','cl7','cl8','cl9','cl10',
    'cl11','cl12','cl13','cl14','cl15','cl16','cl17','cl18','cl19','cl20',
    'cl21','cl22','cl23'
  ]
  const classCodes = ordered.filter(c => classSet.has(c))

  // 5) Убеждаемся, что есть столько же (или больше) названий, сколько классов
  if (uniqueNames.length < classCodes.length) {
    for (let i = uniqueNames.length; i < classCodes.length; i++) {
      uniqueNames.push(`Класс ${classCodes[i]}`)
    }
  }

  // 6) Полностью пересоздаём mkbscategories, чтобы избежать конфликтов уникальности URL
  await MKBCategory.deleteMany({})

  const categoryDocs = [] as Array<{ name: string; class: string; url: string }>
  for (let i = 0; i < classCodes.length; i++) {
    const cls = classCodes[i]
    // Спец-правила: cl22 -> Безрезультатные вызовы, cl23 -> Коды для особых целей, cl5 -> Психические расстройства и расстройства поведения
    let name = uniqueNames[i]
    if (cls === 'cl22') name = 'Безрезультатные вызовы'
    else if (cls === 'cl23') name = 'Коды для особых целей'
    else if (cls === 'cl5') name = 'Психические расстройства и расстройства поведения'
    const url = `${slugifyForUrl(name)}-${cls}`
    categoryDocs.push({ name, class: cls, url })
  }

  // Вставляем разом
  const inserted = await MKBCategory.insertMany(categoryDocs, { ordered: true })
  const results = inserted.map(d => d.toObject())

  // 7) Перезаливаем mkbs согласно карте class -> category
  const classToCategoryId = new Map<string, string>()
  for (const c of results) classToCategoryId.set(String(c.class), String(c._id))
  await MKB.deleteMany({})
  const docs = mkbData.map((item: any) => ({
    category: classToCategoryId.get(String(item.class).trim())!,
    stationCode: String(item.codeStation),
    mkbCode: String(item.codeMkb),
    name: String(item.description || '').trim(),
    note: String(item.additional || '').trim() || undefined
  }))
  await MKB.insertMany(docs, { ordered: false })

  return { success: true, categoriesUpdated: results.length, mkbsInserted: docs.length }
})


