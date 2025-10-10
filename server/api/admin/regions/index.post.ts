import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Region from '~/server/models/Region'
import RegionPhone from '~/server/models/RegionPhone'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  
  const body = await readBody(event)
  const { name, manager, district, phones } = body
  
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Название региона обязательно'
    })
  }
  
  try {
    // Создаем регион
    const region = new Region({
      name,
      manager,
      district,
      phones: phones || []
    })
    
    await region.save()
    
    // Обновляем счетчики использования для названий телефонов
    if (phones && phones.length > 0) {
      for (const phone of phones) {
        if (phone.name) {
          await RegionPhone.findOneAndUpdate(
            { name: phone.name },
            { $inc: { usageCount: 1 } },
            { upsert: true, new: true }
          )
        }
      }
    }
    
    return { success: true, region }
  } catch (error: any) {
    if (error.code === 11000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Регион с таким названием уже существует'
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при создании региона'
    })
  }
})
