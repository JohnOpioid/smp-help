import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Test from '~/server/models/Test'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user: any = await requireUser(event)
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const body = await readBody(event)
  const { question, answers } = body || {}
  if (!question || !String(question).trim()) return { success: false, message: 'Вопрос обязателен' }
  const normAnswers = Array.isArray(answers)
    ? answers.filter((a: any) => a && String(a.text || '').trim()).map((a: any) => ({ text: String(a.text).trim(), isCorrect: Boolean(a.isCorrect) }))
    : []
  if (normAnswers.length < 1) return { success: false, message: 'Нужно хотя бы 1 ответ' }

  const item = await Test.findByIdAndUpdate(id, {
    $set: {
      suggestion: {
        question: String(question).trim(),
        answers: normAnswers,
        createdBy: user._id,
        createdAt: new Date()
      }
    }
  }, { new: true })
    .populate('suggestion.createdBy', 'firstName lastName email avatarUrl telegram')
    .lean()

  return { success: true, item }
})


