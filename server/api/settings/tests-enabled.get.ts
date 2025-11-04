import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Setting from '~/server/models/Setting'

export default defineEventHandler(async () => {
  await connectDB()
  const doc = await Setting.findOne({ key: 'testsEnabled' }).lean()
  const enabled = Boolean(doc?.value)
  return { success: true, enabled }
})


