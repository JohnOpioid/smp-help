import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  const { mkbCodes } = await readBody(event)
  
  if (!mkbCodes || !Array.isArray(mkbCodes) || mkbCodes.length === 0) {
    return { success: false, message: 'Коды МКБ не предоставлены' }
  }

  try {
    // Ищем локальные статусы по кодам МКБ
    const localStatuses = await LocalStatus.find({
      code: { $in: mkbCodes }
    }).populate('category', 'name url').lean()

    return {
      success: true,
      localStatuses,
      foundCodes: localStatuses.map(ls => ls.code),
      notFoundCodes: mkbCodes.filter(code => !localStatuses.some(ls => ls.code === code))
    }
  } catch (error) {
    console.error('Ошибка при поиске локальных статусов:', error)
    return { success: false, message: 'Ошибка при поиске локальных статусов' }
  }
})
