import { defineEventHandler, readMultipartFormData, createError } from 'h3'
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
  
  // В продакшене сохраняем в /var/www/html/public/uploads/avatars/
  const uploadDir = '/var/www/html/public/uploads/avatars/'
  const fs = await import('fs').then(m => m.promises)
  
  try {
    // Создаем директорию если её нет
    await fs.mkdir(uploadDir, { recursive: true })
    
    // Сохраняем файл
    const filePath = `${uploadDir}${name}`
    await fs.writeFile(filePath, (filePart as any).data)
  } catch (error: any) {
    console.error('Error saving avatar:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save file' })
  }

  const url = `/uploads/avatars/${name}`
  return { success: true, url }
})


