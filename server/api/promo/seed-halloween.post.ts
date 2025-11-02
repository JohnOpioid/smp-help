import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoEvent from '~/server/models/PromoEvent'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const title = 'Хеллоуин'
  const slug = 'halloween'
  const now = new Date()
  const start = new Date(now.getFullYear(), 9, 15) // 15 октября
  const end = new Date(now.getFullYear(), 10, 5) // 5 ноября
  const drawAt = new Date(now.getFullYear(), 10, 1)
  const existing = await PromoEvent.findOne({ slug })
  if (existing) return { success: true, item: existing }
  const item = await PromoEvent.create({
    title,
    slug,
    description: 'Собери тыквы по сайту и участвуй в розыгрыше! 🎃',
    startAt: start,
    endAt: end,
    drawAt,
    requiredCount: 7,
    spriteIcon: 'i-lucide-ghost',
    themeLogo: 'i-lucide-ghost',
    themeColor: 'orange',
    published: true
  })
  return { success: true, item }
})


