import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoEvent from '~/server/models/PromoEvent'

export default defineEventHandler(async (event) => {
  await connectDB()
  const slug = event.context.params?.slug
  if (!slug) return { success: false, message: 'slug обязателен' }
  const item = await PromoEvent.findOne({ slug }).lean()
  if (!item) return { success: false, message: 'Ивент не найден' }
  return { success: true, item }
})


