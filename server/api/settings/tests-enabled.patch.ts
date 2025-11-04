import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Setting from '~/server/models/Setting'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const body = await readBody(event)
  const enabled = Boolean(body?.enabled)
  const updated = await Setting.findOneAndUpdate(
    { key: 'testsEnabled' },
    { key: 'testsEnabled', value: enabled },
    { upsert: true, new: true }
  )
  return { success: true, enabled: Boolean(updated?.value) }
})


