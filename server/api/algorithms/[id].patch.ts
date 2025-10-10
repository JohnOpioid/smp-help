import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const body = await readBody(event)
  const { category, section, title, mkbCodes, content, order } = body || {}
  const update: any = { category, section, title, mkbCodes, content }
  if (order !== undefined) update.order = Number(order)
  const updated = await Algorithm.findByIdAndUpdate(id, update, { new: true })
  if (!updated) return { success: false, message: 'Алгоритм не найден' }
  return { success: true, item: updated }
})


