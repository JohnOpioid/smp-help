import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = getRouterParam(event, 'id')

  if (!id) {
    return { success: false, message: 'ID МКБ кода не указан' }
  }

  const deleted = await MKB.findByIdAndDelete(id).lean()

  if (!deleted) {
    return { success: false, message: 'МКБ код не найден' }
  }

  return { success: true, message: 'МКБ код успешно удален' }
})
