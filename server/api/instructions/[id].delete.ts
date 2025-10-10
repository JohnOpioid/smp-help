import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Instruction from '~/server/models/Instruction'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = event.context.params?.id as string
  if (!id) return { success: false, message: 'id не указан' }
  const deleted = await Instruction.findByIdAndDelete(id)
  if (!deleted) return { success: false, message: 'Не найдено' }
  return { success: true }
})


