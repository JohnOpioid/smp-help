import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomCpr from '~/server/models/ClassroomCpr'
import { slugifyForUrl } from '~/server/utils/textNormalization'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { title, slug, rows, notes, order, icon } = body || {}
  if (!title) {
    return { success: false, message: 'title is required' }
  }
  const s = slug || slugifyForUrl(title)
  const defaultIcon = icon || 'i-lucide-table'
  // Создаем таблицу 3x2 (3 столбца, 2 строки)
  const initialGrid: any[] = []
  for (let r = 0; r < 2; r++) {
    const row: any[] = []
    for (let c = 0; c < 3; c++) {
      row.push({ value: '', colspan: 1, rowspan: 1, hidden: false })
    }
    initialGrid.push(row)
  }
  const doc = await ClassroomCpr.create({ title, slug: s, icon: defaultIcon, grid: initialGrid, merges: [], columns: 3, rows: [], notes: [], order: order || 0 })
  return { success: true, item: { _id: doc._id } }
})


