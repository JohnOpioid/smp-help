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
  let diagnostics: Record<string, any> = {}
  try {
    const path = await import('node:path')
    const child = await import('node:child_process')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require(path.join(process.cwd(), 'package.json')) as { version?: string }
    const base = String(pkg?.version || '0.0.0')
    const [major = '0', minor = '0'] = base.split('.')
    function resolveGit(): string {
      const envGit = process.env.GIT_BIN || process.env.GIT_PATH
      // 1) If git is on PATH
      try {
        child.execSync('git --version', { stdio: ['ignore', 'pipe', 'ignore'], shell: process.platform === 'win32' })
        return 'git'
      } catch {}
      try {
        const whereOut = child.execSync(process.platform === 'win32' ? 'where.exe git' : 'which git', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
        const first = whereOut.split(/\r?\n/).find(Boolean)
        if (first) return first.includes(' ') ? `"${first}"` : first
      } catch {}
      const candidates = [
        envGit,
        'C:/Program Files/Git/bin/git.exe',
        'C:/Program Files/Git/cmd/git.exe',
        'C:/Program Files (x86)/Git/bin/git.exe',
        'C:\\Program Files\\Git\\bin\\git.exe',
        'C:\\Program Files\\Git\\cmd\\git.exe',
        'C:\\Program Files (x86)\\Git\\bin\\git.exe',
        'git'
      ].filter(Boolean) as string[]
      for (const c of candidates) {
        try {
          child.execSync(`${c.includes(' ') ? `"${c}"` : c} --version`, { stdio: ['ignore', 'pipe', 'ignore'] })
          return c.includes(' ') ? `"${c}"` : c
        } catch {}
      }
      return 'git'
    }
    const git = resolveGit()
    diagnostics.git = git
    // Найдём корень репозитория для корректного выполнения git-команд
    function findGitRoot(startDir: string): string | null {
      const fs = require('node:fs') as typeof import('node:fs')
      let dir = startDir
      for (let i = 0; i < 8; i++) {
        try {
          if (fs.existsSync(path.join(dir, '.git'))) return dir
        } catch {}
        const parent = path.dirname(dir)
        if (parent === dir) break
        dir = parent
      }
      return null
    }
    const cwd = findGitRoot(process.cwd())
    diagnostics.cwd = cwd
    let sha = ''
    try {
      if (!cwd) throw new Error('not_a_git_repo')
      sha = child.execSync(`${git} rev-parse --short HEAD`, { stdio: ['ignore', 'pipe', 'ignore'], cwd, shell: process.platform === 'win32' }).toString().trim()
    } catch {
      reason = !cwd ? 'not_a_git_repo' : 'git_unavailable'
    }
    // Fallback: пытаемся прочитать SHA напрямую из .git без бинаря git
    if (!sha && cwd) {
      try {
        const fs = require('node:fs') as typeof import('node:fs')
        const headPath = path.join(cwd, '.git', 'HEAD')
        if (fs.existsSync(headPath)) {
          const head = fs.readFileSync(headPath, 'utf8').trim()
          if (head.startsWith('ref:')) {
            const ref = head.split(' ')[1]
            const refPath = path.join(cwd, '.git', ref)
            if (fs.existsSync(refPath)) {
              sha = fs.readFileSync(refPath, 'utf8').trim().slice(0, 7)
            } else {
              // попробуем packed-refs
              const packed = path.join(cwd, '.git', 'packed-refs')
              if (fs.existsSync(packed)) {
                const lines = fs.readFileSync(packed, 'utf8').split(/\r?\n/)
                const line = lines.find(l => l && !l.startsWith('#') && l.endsWith(ref))
                if (line) sha = line.split(' ')[0].slice(0, 7)
              }
            }
          } else if (/^[0-9a-fA-F]{7,40}$/.test(head)) {
            sha = head.slice(0, 7)
          }
        }
      } catch {}
      if (sha) {
        diagnostics.shaSource = 'filesystem'
        reason = undefined
      }
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
  return { success: true, version, updated, reason, diagnostics, timestamp: Date.now() }
})


