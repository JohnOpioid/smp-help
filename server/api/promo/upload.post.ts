import { defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '~/server/utils/auth'
import { promises as fs } from 'node:fs'
import path from 'node:path'

function decodeDataUrl(dataUrl: string): { mime: string, buffer: Buffer } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!m) throw new Error('INVALID_DATA_URL')
  const mime = m[1]
  const buffer = Buffer.from(m[2], 'base64')
  return { mime, buffer }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const { filename, data } = body || {}
  if (!filename || !data) return { success: false, message: 'filename и data обязательны' }

  const { mime, buffer } = decodeDataUrl(String(data))
  // Разрешённые форматы: svg, png, jpg, webp
  const allowed = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
  if (!allowed.includes(mime)) return { success: false, message: 'Недопустимый тип файла' }

  const extMap: Record<string, string> = {
    'image/svg+xml': '.svg',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp'
  }
  const safeExt = extMap[mime] || path.extname(filename) || ''
  const baseName = path.parse(filename).name.replace(/[^a-zA-Z0-9_-]+/g, '-') || 'file'
  const unique = `${baseName}-${Date.now()}${safeExt}`

  // Папка uploads/promo уже обслуживается Nitro publicAssets
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'promo')
  await fs.mkdir(uploadDir, { recursive: true })
  const target = path.join(uploadDir, unique)
  await fs.writeFile(target, buffer)

  const url = `/uploads/promo/${unique}`
  return { success: true, url }
})


