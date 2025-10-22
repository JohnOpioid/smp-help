import { promises as fsp } from 'fs'
import { join } from 'pathe'

export default defineEventHandler(async () => {
  let version = '0.0.0'
  try {
    // Сначала пробуем сгенерированный файл
    const p = join(process.cwd(), '.app-version')
    version = (await fsp.readFile(p, 'utf8')).toString().trim()
  } catch {
    try {
      // Фолбэк к package.json
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = require('../../package.json') as { version?: string }
      version = String(pkg?.version || '0.0.0')
    } catch {}
  }
  return { success: true, version, timestamp: Date.now() }
})


