import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { defineEventHandler } from 'h3'
import { requireAdmin } from '~/server/utils/auth'
// Используем $fetch от Nuxt для серверных HTTP-запросов

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const users = await User.find({}).select('_id avatarUrl telegram firstName lastName').lean()
  let updated = 0
  const cfg = useRuntimeConfig()
  const botToken = cfg.telegramBotToken
  for (const u of users) {
    const hasCustom = typeof u.avatarUrl === 'string' && u.avatarUrl.trim().length > 0
    const tgPhoto = (u as any)?.telegram?.photo_url || (u as any)?.telegram?.photoUrl
    if (!hasCustom && tgPhoto) {
      await User.findByIdAndUpdate(u._id, { $set: { avatarUrl: tgPhoto } })
      updated++
      continue
    }

    // Если фото в профиле Telegram не сохранено в БД, но есть telegram.id — попробуем подтянуть через Bot API
    const tgId = (u as any)?.telegram?.id
    if (!hasCustom && !tgPhoto && botToken && tgId) {
      try {
        // 1) получаем список фото профиля
        const photosResp: any = await $fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos`, {
          method: 'POST',
          body: { user_id: tgId, limit: 1 },
          headers: { 'content-type': 'application/json' }
        })
        const photoSizes = photosResp?.result?.photos?.[0]
        const best = Array.isArray(photoSizes) ? photoSizes[photoSizes.length - 1] : null
        const fileId = best?.file_id
        if (!fileId) continue
        // 2) получаем file_path
        const fileResp: any = await $fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
          method: 'POST',
          body: { file_id: fileId },
          headers: { 'content-type': 'application/json' }
        })
        const filePath = fileResp?.result?.file_path
        if (!filePath) continue
        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`
        await User.findByIdAndUpdate(u._id, { $set: { avatarUrl: fileUrl } })
        updated++
      } catch (e) {
        // пропускаем ошибки API
      }
    }
  }

  return { success: true, updated }
})


