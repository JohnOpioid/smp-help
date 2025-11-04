import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Test from '~/server/models/Test'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user: any = await requireUser(event)
  await connectDB()
  const body = await readBody(event)
  const { category, question, answers } = body || {}

  if (!category) return { success: false, message: 'Категория обязательна' }
  if (!question || !String(question).trim()) return { success: false, message: 'Вопрос обязателен' }

  const normAnswers = Array.isArray(answers)
    ? answers
        .filter((a: any) => a && String(a.text || '').trim())
        .map((a: any) => ({ text: String(a.text).trim(), isCorrect: Boolean(a.isCorrect) }))
    : []
  if (normAnswers.length < 2) return { success: false, message: 'Нужно минимум 2 ответа' }

  const item = await Test.create({
    category,
    question: String(question).trim(),
    answers: normAnswers,
    approved: false,
    createdBy: user._id
  })
  return { success: true, item }
})


