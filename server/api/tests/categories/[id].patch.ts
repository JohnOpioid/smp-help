import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import TestCategory from '~/server/models/TestCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const body = await readBody(event)
  const { name, description, url } = body || {}
  const update: any = {}
  if (typeof name === 'string') update.name = name
  if (typeof description === 'string') update.description = description
  if (typeof url === 'string') update.url = url
  const item = await TestCategory.findByIdAndUpdate(id, update, { new: true })
  return { success: true, item }
})



