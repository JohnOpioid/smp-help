import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'
import { slugifyForUrl } from '~/server/utils/textNormalization'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const body = await readBody(event)
    console.log('[local-statuses] POST body:', body)
    const { name } = body || {}
    if (!name || !String(name).trim()) {
      return { success: false, message: 'Название обязательно' }
    }

    const url = slugifyForUrl(String(name))

    // Проверка существования
    const exists = await LocalStatusCategory.findOne({ $or: [{ name }, { url }] })
    if (exists) {
      return { success: false, message: 'Категория с таким названием или URL уже существует' }
    }

    const item = await LocalStatusCategory.create({ name, url })
    console.log('[local-statuses] created category:', { _id: item._id, name: item.name, url: item.url })
    return { success: true, item }
  } catch (e: any) {
    console.error('[local-statuses] POST error:', e)
    return { success: false, message: e?.message || 'Ошибка сервера при создании категории' }
  }
})


