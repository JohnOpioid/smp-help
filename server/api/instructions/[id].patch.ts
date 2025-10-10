import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Instruction from '~/server/models/Instruction'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const id = event.context.params?.id as string
  const body = await readBody(event)
  const { title, code, description } = body || {}

  if (!id) return { success: false, message: 'id не указан' }

  const updated = await Instruction.findByIdAndUpdate(
    id,
    { $set: { title, code, description } },
    { new: true }
  )

  if (!updated) return { success: false, message: 'Не найдено' }
  return { success: true, item: updated }
})


