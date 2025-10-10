import { defineEventHandler, readBody, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { category, stationCode, mkbCode, name, note } = body

  if (!id) {
    return { success: false, message: 'ID МКБ кода не указан' }
  }
  if (!category || !stationCode || !mkbCode || !name) {
    return { success: false, message: 'Укажите category, stationCode, mkbCode и name' }
  }

  const updated = await MKB.findByIdAndUpdate(
    id,
    { category, stationCode, mkbCode, name, note },
    { new: true }
  ).populate('category', 'name url').lean()

  if (!updated) {
    return { success: false, message: 'МКБ код не найден' }
  }

  return { success: true, item: updated }
})
