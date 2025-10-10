import { defineEventHandler, readBody, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Region from '~/server/models/Region'
import RegionPhone from '~/server/models/RegionPhone'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { name, manager, district, phones } = body
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID региона обязателен'
    })
  }
  
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Название региона обязательно'
    })
  }
  
  try {
    // Получаем старый регион для обновления счетчиков
    const oldRegion = await Region.findById(id)
    if (!oldRegion) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Регион не найден'
      })
    }
    
    // Уменьшаем счетчики для старых телефонов
    if (oldRegion.phones && oldRegion.phones.length > 0) {
      for (const phone of oldRegion.phones) {
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
    
    // Обновляем регион
    const region = await Region.findByIdAndUpdate(
      id,
      { name, manager, district, phones: phones || [] },
      { new: true }
    )
    
    // Увеличиваем счетчики для новых телефонов
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
      statusMessage: 'Ошибка при обновлении региона'
    })
  }
})
