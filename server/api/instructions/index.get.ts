import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Instruction from '~/server/models/Instruction'

export default defineEventHandler(async () => {
  await connectDB()
  const items = await Instruction.find().sort({ createdAt: -1 }).lean()
  return { success: true, items }
})


