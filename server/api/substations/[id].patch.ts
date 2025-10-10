import { defineEventHandler, readBody, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Substation from '~/server/models/Substation'
import { requireAdmin } from '~/server/utils/auth'
import { geocodeAddress } from '~/server/utils/geocode'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { name, address, phones, location, region } = body || {}

  if (!id) return { success: false, message: 'ID не указан' }

  let updateDoc: any = { name, address, phones, region }
  if (location?.coordinates && location.coordinates.length === 2) {
    updateDoc.location = location
  } else if (address) {
    const apiKey = (useRuntimeConfig().public as any)?.yamapsApiKey || ''
    const geocoded = await geocodeAddress(address, apiKey)
    if (geocoded) updateDoc.location = { type: 'Point', coordinates: geocoded }
  }

  const updated = await Substation.findByIdAndUpdate(id, updateDoc, { new: true }).lean()

  if (!updated) return { success: false, message: 'Подстанция не найдена' }
  return { success: true, item: updated }
})


