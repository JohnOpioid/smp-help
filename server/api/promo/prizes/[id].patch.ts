import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoPrize from '~/server/models/PromoPrize'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = event.context.params?.id
  if (!id) return { success: false, message: 'id обязателен' }
  const body = await readBody(event)
  const update: any = {}
  if ('title' in body) update.title = body.title
  if ('description' in body) update.description = body.description
  if ('imageUrl' in body) update.imageUrl = body.imageUrl
  if ('order' in body) update.order = Number(body.order) || 0
  const prize = await PromoPrize.findByIdAndUpdate(id, update, { new: true })
  return { success: true, prize }
})

