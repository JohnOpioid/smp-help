import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import News from '~/server/models/News'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = event.context.params?.id
  if (!id) return { success: false, message: 'id обязателен' }
  await News.findByIdAndDelete(id)
  return { success: true }
})


