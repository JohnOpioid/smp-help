import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import { requireAdmin } from '~/server/utils/auth'
import MKBCategory from '~/server/models/MKBCategory'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { slugifyForUrl } from '~/server/utils/textNormalization'

type Cat = { class: string; name: string }

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const filePath = resolve(process.cwd(), 'public', 'mkbCategories.json')
  const raw = await readFile(filePath, 'utf-8')
  const items = JSON.parse(raw) as Cat[]

  // Полностью пересоздаём коллекцию
  await MKBCategory.deleteMany({})

  const docs = items.map(i => ({
    class: String(i.class).trim(),
    name: String(i.name).trim(),
    url: `${slugifyForUrl(String(i.name).trim())}-${String(i.class).trim()}`
  }))

  const inserted = await MKBCategory.insertMany(docs, { ordered: true })
  return { success: true, inserted: inserted.length }
})


