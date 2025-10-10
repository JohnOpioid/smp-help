import { defineEventHandler } from 'h3'
import fs from 'node:fs/promises'
import path from 'node:path'
import connectDB from '~/server/utils/mongodb'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'
import LocalStatus from '~/server/models/LocalStatus'
// По текущей задаче не тянем МКБ/код станции из БД
import { slugifyForUrl } from '~/server/utils/textNormalization'

type RawStatus = {
  classStLoc?: string
  title?: string
  diagnosis?: string
  complaints?: string
  anamnesis?: string
  localis?: string
}

export default defineEventHandler(async () => {
  await connectDB()

  const jsonPath = path.resolve(process.cwd(), 'public', 'statuslocalis.json')
  const raw = await fs.readFile(jsonPath, 'utf-8')
  const items: RawStatus[] = JSON.parse(raw)

  let createdCategories = 0
  let createdStatuses = 0
  let skippedStatuses = 0

  // Кэш категорий по имени
  const nameToCategoryId = new Map<string, string>()

  for (const it of items) {
    const catName = String(it.classStLoc || '').trim()
    const title = String(it.title || '').trim()
    if (!catName || !title) { skippedStatuses++; continue }

    let catId = nameToCategoryId.get(catName)
    if (!catId) {
      const url = slugifyForUrl(catName)
      const existed = await LocalStatusCategory.findOne({ $or: [{ name: catName }, { url }] }).lean()
      if (existed) {
        catId = String(existed._id)
      } else {
        const created = await LocalStatusCategory.create({ name: catName, url })
        catId = String(created._id)
        createdCategories++
      }
      nameToCategoryId.set(catName, catId)
    }

    // Собираем описание в markdown
    const complaints = String(it.complaints || '').trim() || undefined
    const anamnesis = String(it.anamnesis || '').trim() || undefined
    const localis = String(it.localis || '').trim() || undefined
    const description = undefined

    // Критерий уникальности: категория + название
    const exists = await LocalStatus.findOne({ category: catId, name: title }).lean()
    if (exists) { skippedStatuses++; continue }

    const code = slugifyForUrl(title)
    const stationCode = '-' // очистка: не подставляем код станции

    await LocalStatus.create({ category: catId, stationCode, code, name: title, description, complaints, anamnesis, localis })
    createdStatuses++
  }

  return { success: true, createdCategories, createdStatuses, skippedStatuses }
})


