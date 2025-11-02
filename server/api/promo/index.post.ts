import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoEvent from '~/server/models/PromoEvent'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const body = await readBody(event)
  const { title, slug, description, startAt, endAt, drawAt, requiredCount, spriteIcon, themeLogo, themeColor, themeBgColor, themePrimaryColor, themeSecondaryColor, themeTextPrimaryColor, themeTextSecondaryColor, panelOpacity, spawnChance, bgImageUrl, eventLogoUrl, published, isRecurring } = body || {}
  if (!title || !slug || !spriteIcon || !startAt || !endAt) return { success: false, message: 'Заполните обязательные поля' }
  const item = await PromoEvent.create({
    title,
    slug,
    description,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    drawAt: drawAt ? new Date(drawAt) : undefined,
    requiredCount: Number(requiredCount) || 5,
    spriteIcon,
    themeLogo,
    themeColor,
    themeBgColor,
    themePrimaryColor,
    themeSecondaryColor,
    themeTextPrimaryColor,
    themeTextSecondaryColor,
    panelOpacity: Math.max(0, Math.min(100, Number(panelOpacity ?? 8))),
    spawnChance: Math.max(0, Math.min(100, Number(spawnChance ?? 100))),
    bgImageUrl,
    eventLogoUrl,
    published: !!published,
    isRecurring: !!isRecurring
  })
  return { success: true, item }
})


