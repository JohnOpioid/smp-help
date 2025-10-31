import { defineEventHandler } from 'h3'
import { requireAdmin } from '~/server/utils/auth'
import connectDB from '~/server/utils/mongodb'
import AppMeta from '~/server/models/AppMeta'
import { getAppVersion, invalidateVersionCache } from '~/server/utils/version'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const doc = await AppMeta.findOneAndUpdate(
    { key: 'app_version' },
    { $inc: { counter: 1 } },
    { upsert: true, new: true }
  )

  const counter = Number(doc?.counter || 1)
  const major = 1
  const minor = Math.floor(counter / 10)
  const patch = counter % 10
  const version = `${major}.${minor}.${patch}`

  await AppMeta.updateOne({ key: 'app_version' }, { $set: { version } })

  invalidateVersionCache()
  await getAppVersion(true)

  return { success: true, version, counter, timestamp: Date.now() }
})


