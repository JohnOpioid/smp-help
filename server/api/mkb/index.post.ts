import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const body = await readBody(event)
  const { category, stationCode, mkbCode, name, note } = body || {}

  if (!category || !stationCode || !mkbCode || !name) {
    return { success: false, message: 'category, stationCode, mkbCode и name обязательны' }
  }

  const item = await MKB.create({ category, stationCode, mkbCode, name, note })
  return { success: true, item }
})
