import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Test from '~/server/models/Test'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user: any = await requireAdmin(event)
  await connectDB()
  const body = await readBody(event)
  const { category, question, answers, explanation, markdown, order } = body || {}

  if (!category) return { success: false, message: 'Категория обязательна' }
  if (!question || !String(question).trim()) return { success: false, message: 'Вопрос обязателен' }

  const normAnswers = Array.isArray(answers) ? answers.filter((a: any) => a && String(a.text || '').trim()).map((a: any) => ({ text: String(a.text).trim(), isCorrect: Boolean(a.isCorrect) })) : []

  const item = await Test.create({ 
    category, 
    question: String(question).trim(), 
    answers: normAnswers, 
    explanation, 
    markdown, 
    order: typeof order === 'number' ? order : 0,
    createdBy: user._id,
    approved: true
  })
    .then((doc: any) => doc.populate('createdBy', 'firstName lastName email avatarUrl telegram'))
    .then((doc: any) => doc.toObject())
  return { success: true, item }
})



