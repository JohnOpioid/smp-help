import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Instruction from '~/server/models/Instruction'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const admin: any = await requireAdmin(event)
  await connectDB()
  const body = await readBody(event)
  const { title, code, description } = body

  if (!title || !code) {
    return { success: false, message: 'Укажите title и code' }
  }

  const created = await Instruction.create({ title, code, description, createdBy: admin._id })
  return { success: true, item: created }
})


