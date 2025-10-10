import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Substation from '~/server/models/Substation'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }

  const deleted = await Substation.findByIdAndDelete(id).lean()
  if (!deleted) return { success: false, message: 'Подстанция не найдена' }
  return { success: true }
})


