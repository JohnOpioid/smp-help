import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Instruction from '~/server/models/Instruction'

export default defineEventHandler(async (event) => {
  await connectDB()
  const code = getRouterParam(event, 'code')
  if (!code) return { success: false, message: 'Код не указан' }

  const item = await Instruction.findOne({ code }).lean()
  if (!item) return { success: false, message: 'Инструкция не найдена' }

  return { success: true, item }
})

