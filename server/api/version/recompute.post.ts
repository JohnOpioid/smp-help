import { defineEventHandler } from 'h3'
import { getAppVersion, invalidateVersionCache } from '~/server/utils/version'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  invalidateVersionCache()
  const version = await getAppVersion(true)
  return { success: true, version, timestamp: Date.now() }
})


