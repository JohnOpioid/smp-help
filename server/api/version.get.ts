// Простая версия без дополнительных зависимостей

// Кэшируем вычисленную версию на время жизни процесса, чтобы не было дребезга
let cachedVersion: string | null = null

export default defineEventHandler(async () => {
  if (!cachedVersion) {
    let version = '0.0.0'
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = require('../../package.json') as { version?: string }
      version = String(pkg?.version || '0.0.0')
    } catch {
      // Если не можем прочитать package.json, используем дефолтную версию
      version = '0.0.0'
    }
    cachedVersion = version
  }
  return { success: true, version: cachedVersion, timestamp: Date.now() }
})


