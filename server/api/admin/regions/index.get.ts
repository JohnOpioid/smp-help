import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Region from '~/server/models/Region'
import RegionPhone from '~/server/models/RegionPhone'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  
  const regions = await Region.find({}).sort({ createdAt: 1 }).lean()
  const phoneNames = await RegionPhone.find({}).sort({ name: 1 }).lean()
  
  return { 
    success: true, 
    regions,
    phoneNames: phoneNames.map(p => p.name)
  }
})
