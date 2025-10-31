import { defineEventHandler } from 'h3'
import { getAppVersion, invalidateVersionCache } from '~/server/utils/version'
import { requireAdmin } from '~/server/utils/auth'
import connectDB from '~/server/utils/mongodb'
import AppMeta from '~/server/models/AppMeta'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  invalidateVersionCache()

  // Сначала пробуем git
  let version = ''
  let updated = false
  let reason: string | undefined
  try {
    const path = await import('node:path')
    const child = await import('node:child_process')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require(path.join(process.cwd(), 'package.json')) as { version?: string }
    const base = String(pkg?.version || '0.0.0')
    const [major = '0', minor = '0'] = base.split('.')
    function resolveGit(): string {
      const envGit = process.env.GIT_BIN || process.env.GIT_PATH
      const candidates = [
        envGit,
        'C://Program Files//Git//bin//git.exe',
        'C://Program Files//Git//cmd//git.exe',
        'C://Program Files (x86)//Git//bin//git.exe',
        'git'
      ].filter(Boolean) as string[]
      for (const c of candidates) {
        try {
          child.execSync(`"${c}" --version`, { stdio: ['ignore', 'pipe', 'ignore'] })
          return c.includes(' ') ? `"${c}"` : c
        } catch {}
      }
      return 'git'
    }
    const git = resolveGit()
    let sha = ''
    try {
      sha = child.execSync(`${git} rev-parse --short HEAD`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      reason = 'git_unavailable'
    }
    await connectDB()
    const doc = await AppMeta.findOne({ key: 'app_version' })
    const lastSha = (doc as any)?.lastCommit || ''
    let counter = Number((doc as any)?.counter || 0)
    // Пересчитываем только если появился новый коммит
    if (sha && sha !== lastSha) {
      counter += 1
      // 1.0.N; каждые 10 -> 1.1.0 и т.д.
      const baseMajor = 1
      const newMinor = Math.floor(counter / 10)
      const newPatch = counter % 10
      version = `${baseMajor}.${newMinor}.${newPatch}`
      await AppMeta.findOneAndUpdate(
        { key: 'app_version' },
        { $set: { version, lastCommit: sha, counter } },
        { upsert: true, new: true }
      )
      updated = true
    } else {
      // без нового коммита — оставляем текущую версию
      version = (doc as any)?.version || `${major}.${minor}.0`
      if (!reason) reason = sha ? 'no_new_commit' : 'git_unavailable'
    }
  } catch {}

  // Если git недоступен или дал 0 — используем счётчик в БД
  if (!version) {
    await connectDB()
    const doc = await AppMeta.findOneAndUpdate(
      { key: 'app_version' },
      // без git не можем проверить новый коммит, поэтому не инкрементим
      { $setOnInsert: { counter: 0 } },
      { upsert: true, new: true }
    )
    const counter = Number(doc?.counter || 0)
    const baseMajor = 1
    const newMinor = Math.floor(counter / 10)
    const newPatch = counter % 10
    version = `${baseMajor}.${newMinor}.${newPatch}`
    await AppMeta.updateOne({ key: 'app_version' }, { $set: { version } })
  }

  // Вернём и обновим кэш
  await getAppVersion(true)
  return { success: true, version, updated, reason, timestamp: Date.now() }
})


