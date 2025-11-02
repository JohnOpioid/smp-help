import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoEvent from '~/server/models/PromoEvent'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = event.context.params?.id
  if (!id) return { success: false, message: 'id обязателен' }
  const body = await readBody(event)
  const update: any = {}
  for (const k of ['title','slug','description','spriteIcon','themeLogo','themeColor','themeBgColor','themePrimaryColor','themeSecondaryColor','themeTextPrimaryColor','themeTextSecondaryColor','panelOpacity','spawnChance','bgImageUrl','eventLogoUrl','published','isRecurring']) {
    if (k in body) update[k] = body[k]
  }
  if ('panelOpacity' in update) update.panelOpacity = Math.max(0, Math.min(100, Number(update.panelOpacity)))
  if ('spawnChance' in update) update.spawnChance = Math.max(0, Math.min(100, Number(update.spawnChance)))
  if ('requiredCount' in body) update.requiredCount = Number(body.requiredCount) || 1
  if ('startAt' in body) update.startAt = body.startAt ? new Date(body.startAt) : null
  if ('endAt' in body) update.endAt = body.endAt ? new Date(body.endAt) : null
  if ('drawAt' in body) update.drawAt = body.drawAt ? new Date(body.drawAt) : null
  const item = await PromoEvent.findByIdAndUpdate(id, update, { new: true })
  return { success: true, item }
})


