import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import DrugCategory from '~/server/models/DrugCategory'
import { slugifyForUrl } from '~/server/utils/textNormalization'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const name = String(body?.name || '').trim()
  if (!name) return { success: false, message: 'Название обязательно' }

  const url = slugifyForUrl(name)
  const exists = await DrugCategory.findOne({ $or: [{ name }, { url }] }).lean()
  if (exists) return { success: false, message: 'Такая категория уже существует' }

  const doc = await DrugCategory.create({ name, url })
  return { success: true, item: doc }
})


