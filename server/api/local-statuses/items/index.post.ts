import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { category, stationCode, code, name, note, description, complaints, anamnesis, localis } = body || {}
  if (!category || !stationCode || !code || !name) return { success: false, message: 'Обязательные поля не заполнены' }
  const item = await LocalStatus.create({ category, stationCode, code, name, note, description, complaints, anamnesis, localis })
  return { success: true, item }
})


