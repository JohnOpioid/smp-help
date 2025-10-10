import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Substation from '~/server/models/Substation'
import { requireAdmin } from '~/server/utils/auth'
import { geocodeAddress } from '~/server/utils/geocode'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const body = await readBody(event)
  const { name, address, phones = [], location, region } = body || {}

  if (!name || !address) {
    return { success: false, message: 'name и address обязательны' }
  }

  let coords = location?.coordinates
  if ((!coords || coords.length !== 2) && address) {
    const apiKey = (useRuntimeConfig().public as any)?.yamapsApiKey || ''
    const geocoded = await geocodeAddress(address, apiKey)
    if (geocoded) coords = geocoded
  }
  const loc = { type: 'Point', coordinates: coords || [37.618423, 55.751244] }
  const item = await Substation.create({ name, address, phones, location: loc, region })
  return { success: true, item }
})


