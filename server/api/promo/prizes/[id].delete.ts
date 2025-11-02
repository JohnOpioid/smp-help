import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoPrize from '~/server/models/PromoPrize'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = event.context.params?.id
  if (!id) return { success: false, message: 'id обязателен' }
  await PromoPrize.findByIdAndDelete(id)
  return { success: true }
})

