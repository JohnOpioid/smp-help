import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Test from '~/server/models/Test'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  
  // Проверяем, является ли пользователь администратором
  let isAdmin = false
  try {
    await requireAdmin(event)
    isAdmin = true
  } catch {
    // Пользователь не администратор - это нормально для публичных предложений
  }
  
  const body = await readBody(event)
  const update: any = {}
  if (typeof body?.category === 'string') update.category = body.category
  if (typeof body?.question === 'string') update.question = body.question
  if (Array.isArray(body?.answers)) {
    update.answers = body.answers.filter((a: any) => a && String(a.text || '').trim()).map((a: any) => ({ text: String(a.text).trim(), isCorrect: Boolean(a.isCorrect) }))
  }
  if (typeof body?.explanation === 'string') update.explanation = body.explanation
  if (typeof body?.markdown === 'string') update.markdown = body.markdown
  if (typeof body?.order === 'number') update.order = body.order
  if (typeof body?.approved === 'boolean') update.approved = body.approved
  
  // Если редактирует администратор и approved не указан явно, автоматически одобряем
  if (isAdmin && body?.approved === undefined) {
    update.approved = true
  }

  const item = await Test.findByIdAndUpdate(id, update, { new: true })
    .populate('createdBy', 'firstName lastName email avatarUrl telegram')
    .lean()
  return { success: true, item }
})



