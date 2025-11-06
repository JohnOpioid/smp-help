import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Instruction from '~/server/models/Instruction'
import Classroom from '~/server/models/Classroom'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  // Загружаем все инструкции
  const ins = await Instruction.find({}).sort({ createdAt: 1 }).lean()
  // Преобразуем в компактный формат
  const items = ins.map((i: any) => ({
    _id: String(i._id),
    title: i.title,
    code: i.code,
    description: i.description || '',
    createdAt: i.createdAt
  }))
  // Сохраняем в Classroom под section: 'instructions'
  const doc = await Classroom.findOneAndUpdate(
    { section: 'instructions' },
    { title: 'Инструкции', data: { items } },
    { new: true, upsert: true }
  )
  return { success: true, migrated: items.length, item: doc }
})


