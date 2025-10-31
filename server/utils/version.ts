let cachedVersion: string | null = null
let cachedAt = 0
const CACHE_TTL_MS = 30_000

export async function getAppVersion(forceRefresh = false): Promise<string> {
  const now = Date.now()
  if (!forceRefresh && cachedVersion && now - cachedAt <= CACHE_TTL_MS) return cachedVersion

  const fs = await import('node:fs')
  const path = await import('node:path')
  const child = await import('node:child_process')

  const root = process.cwd()
  const appVersionFile = path.join(root, '.app-version')
  let version = '0.0.0'

  try {
    if (!forceRefresh && fs.existsSync(appVersionFile)) {
      const v = fs.readFileSync(appVersionFile, 'utf8').trim()
      if (v) {
        const fromFile = (v.split(' ')[0] || v).trim()
        const isDev = process.env.NODE_ENV !== 'production'
        if (!(isDev && (!fromFile || fromFile === '0.0.0'))) {
          version = fromFile
          cachedVersion = version
          cachedAt = now
          return version
        }
      }
    }
  } catch {}

  // Calculate from git
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require(path.join(root, 'package.json')) as { version?: string }
    const base = String(pkg?.version || '0.0.0')
    const [major = '0', minor = '0'] = base.split('.')
    let count = 0
    try {
      const out = child.execSync('git rev-list --count HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
      count = Number(out) || 0
    } catch {}
    version = `${major}.${minor}.${count}`
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = require(path.join(root, 'package.json')) as { version?: string }
      version = String(pkg?.version || '0.0.0')
    } catch {
      version = '0.0.0'
    }
  }

  cachedVersion = version
  cachedAt = now
  return version
}

export function invalidateVersionCache(): void {
  cachedVersion = null
  cachedAt = 0
}


