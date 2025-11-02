import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoPrize from '~/server/models/PromoPrize'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const body = await readBody(event)
  const { eventId, title, description, imageUrl, order } = body || {}
  if (!eventId || !title) return { success: false, message: 'Заполните обязательные поля' }
  const prize = await PromoPrize.create({
    eventId,
    title,
    description,
    imageUrl,
    order: Number(order) || 0
  })
  return { success: true, prize }
})

