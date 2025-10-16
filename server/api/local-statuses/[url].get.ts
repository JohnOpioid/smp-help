import { defineEventHandler, getRouterParam, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'
import { slugifyForUrl } from '~/server/utils/textNormalization'
import Category from '~/server/models/Category'
import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  await connectDB()
  let url = getRouterParam(event, 'url') as string | undefined
  // Фолбэк: иногда getRouterParam может вернуть undefined в некоторых окружениях
  // пробуем вытащить из event.context.params или из пути
  if (!url) url = (event.context as any)?.params?.url
  if (!url) {
    const raw = event.node.req.url || ''
    const parts = raw.split('?')[0].split('/')
    url = parts[parts.length - 1]
  }
  if (!url) {
    return { success: false, message: 'URL категории не указан' }
  }

  const normalized = slugifyForUrl(url)
  const newCat = await LocalStatusCategory.findOne({ $or: [{ url }, { url: normalized }] }).lean()
  const oldCat = await Category.findOne({ $or: [{ url }, { url: normalized }] }).lean()

  if (!newCat && !oldCat) {
    return { success: false, message: 'Категория не найдена' }
  }

  // Собираем только валидные ObjectId и их строковые формы (24 hex)
  const candidateIds: any[] = []
  const pushId = (val: any) => {
    if (!val) return
    candidateIds.push(val)
    const asStr = String(val)
    if (/^[a-fA-F0-9]{24}$/.test(asStr)) candidateIds.push(asStr)
  }
  if (newCat?._id) pushId(newCat._id)
  if (oldCat?._id) pushId(oldCat._id)

  const q = getQuery(event)
  const limit = Math.min(parseInt(String(q.limit || '10')) || 10, 100)
  const skip = Math.max(parseInt(String(q.skip || '0')) || 0, 0)

  const [rawItems, total] = await Promise.all([
    LocalStatus.find({ category: { $in: candidateIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LocalStatus.countDocuments({ category: { $in: candidateIds } })
  ])
  const category = newCat || oldCat
  const items = rawItems.map((it: any) => ({
    ...it,
    category: { name: category?.name, url: category?.url }
  }))
  return { success: true, category, items, total }
})



