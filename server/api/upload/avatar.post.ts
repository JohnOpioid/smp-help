import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { promises as fsp } from 'fs'
import { join } from 'path'
import { nanoid } from 'nanoid'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form || !form.length) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  // Find first part that looks like a file (has filename and data)
  const filePart = form.find((p: any) => p && p.filename && p.data)
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file' })
  }

  // Validate mime (prefer part.type; fallback to extension)
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
  const mime = (filePart as any).type as string | undefined
  const isAllowedMime = mime ? allowed.includes(mime) : true // allow when unknown, will validate by ext below

  const orig = String((filePart as any).filename)
  const ext = orig.includes('.') ? `.${orig.split('.').pop()?.toLowerCase()}` : ''
  const allowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.svg']
  const isAllowedExt = allowedExt.includes(ext)

  if (!isAllowedMime && !isAllowedExt) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported media type' })
  }

  const name = `${nanoid(16)}${ext || ''}`
  const dir = join(process.cwd(), 'public', 'uploads', 'avatars')
  await fsp.mkdir(dir, { recursive: true })

  const dest = join(dir, name)
  await fsp.writeFile(dest, (filePart as any).data)

  const url = `/uploads/avatars/${name}`
  return { success: true, url }
})


