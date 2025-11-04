import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Test from '~/server/models/Test'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }

  const test = await Test.findById(id)
  if (!test || !test.suggestion) return { success: false, message: 'Исправление не найдено' }

  test.question = test.suggestion.question || test.question
  test.answers = Array.isArray(test.suggestion.answers) ? test.suggestion.answers : test.answers
  test.correctedBy = test.suggestion.createdBy
  test.correctedAt = new Date()
  // Не меняем createdBy основного вопроса
  test.suggestion = undefined as any
  const saved = await test.save()
  const populated = await Test.findById(saved._id)
    .populate('createdBy', 'firstName lastName email avatarUrl telegram')
    .populate('correctedBy', 'firstName lastName email avatarUrl telegram')
    .populate('suggestion.createdBy', 'firstName lastName email avatarUrl telegram')
    .lean()
  return { success: true, item: populated }
})


