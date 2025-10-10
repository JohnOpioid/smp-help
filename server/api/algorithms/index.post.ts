import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { category, section, title, mkbCodes, content, order } = body || {}
  if (!category || !section || !title) return { success: false, message: 'Категория, раздел и название обязательны' }
  const payload: any = { category, section, title, mkbCodes: Array.isArray(mkbCodes) ? mkbCodes : [], content }
  if (order !== undefined) payload.order = Number(order)
  const doc = await Algorithm.create(payload)
  return { success: true, item: doc }
})


