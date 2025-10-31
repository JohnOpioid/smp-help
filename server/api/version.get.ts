// Простая версия без дополнительных зависимостей

// Кэшируем вычисленную версию на время жизни процесса, чтобы не было дребезга
import { getAppVersion } from '~/server/utils/version'

export default defineEventHandler(async () => {
  const version = await getAppVersion(false)
  return { success: true, version, timestamp: Date.now() }
})


