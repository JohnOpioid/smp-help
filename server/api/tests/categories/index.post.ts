import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import TestCategory from '~/server/models/TestCategory'
import { slugifyForUrl } from '~/server/utils/textNormalization'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { name, description } = body || {}
  if (!name || !String(name).trim()) return { success: false, message: 'Название обязательно' }

  const url = slugifyForUrl(String(name))

  const exists = await TestCategory.findOne({ $or: [{ name }, { url }] })
  if (exists) return { success: false, message: 'Категория с таким названием или URL уже существует' }

  const item = await TestCategory.create({ name, url, description })
  return { success: true, item }
})



