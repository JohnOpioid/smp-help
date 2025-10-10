import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Region from '~/server/models/Region'
import RegionPhone from '~/server/models/RegionPhone'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID региона обязателен'
    })
  }
  
  try {
    // Получаем регион для обновления счетчиков
    const region = await Region.findById(id)
    if (!region) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Регион не найден'
      })
    }
    
    // Уменьшаем счетчики для телефонов
    if (region.phones && region.phones.length > 0) {
      for (const phone of region.phones) {
        if (phone.name) {
          const phoneDoc = await RegionPhone.findOne({ name: phone.name })
          if (phoneDoc && phoneDoc.usageCount > 0) {
            phoneDoc.usageCount -= 1
            if (phoneDoc.usageCount === 0) {
              await RegionPhone.deleteOne({ _id: phoneDoc._id })
            } else {
              await phoneDoc.save()
            }
          }
        }
      }
    }
    
    // Удаляем регион
    await Region.findByIdAndDelete(id)
    
    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при удалении региона'
    })
  }
})
