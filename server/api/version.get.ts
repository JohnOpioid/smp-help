import { promises as fsp } from 'fs'
import { join } from 'pathe'
import { execSync } from 'child_process'

// Кэшируем вычисленную версию на время жизни процесса, чтобы не было дребезга
let cachedVersion: string | null = null

export default defineEventHandler(async () => {
  if (!cachedVersion) {
    let version = '0.0.0'
    try {
      const p = join(process.cwd(), '.app-version')
      version = (await fsp.readFile(p, 'utf8')).toString().trim()
    } catch {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require('../../package.json') as { version?: string }
        version = String(pkg?.version || '0.0.0')
      } catch {}
    }
    if (!version || version === '0.0.0') {
      try {
        const hash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
        version = hash ? `dev (${hash})` : 'dev'
      } catch {
        version = 'dev'
      }
    }
    cachedVersion = version
  }
  return { success: true, version: cachedVersion, timestamp: Date.now() }
})


