import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Substation from '~/server/models/Substation'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  const { latitude, longitude, maxDistance = 50000 } = await readBody(event) // maxDistance в метрах (50км по умолчанию)
  
  if (!latitude || !longitude) {
    throw createError({
      statusCode: 400,
      message: 'Координаты обязательны'
    })
  }

  try {
    // Используем MongoDB геопространственный запрос для поиска ближайших подстанций
    const nearestSubstations = await Substation.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude] // MongoDB использует [lng, lat]
          },
          distanceField: "distance",
          maxDistance: maxDistance,
          spherical: true
        }
      },
      {
        $limit: 10 // Максимум 10 ближайших подстанций
      }
    ])

    // Добавляем расчет времени доезда (примерная оценка)
    const substationsWithTravelTime = nearestSubstations.map(substation => {
      const distanceKm = substation.distance / 1000
      // Примерная скорость скорой помощи в городе: 40 км/ч
      const estimatedTravelTimeMinutes = Math.round((distanceKm / 40) * 60)
      
      return {
        ...substation,
        distanceKm: Math.round(distanceKm * 10) / 10, // Округляем до 1 знака
        estimatedTravelTime: estimatedTravelTimeMinutes
      }
    })

    return {
      success: true,
      substations: substationsWithTravelTime,
      userLocation: { latitude, longitude }
    }
  } catch (error: any) {
    console.error('Ошибка поиска ближайших подстанций:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка поиска подстанций',
      data: error.message
    })
  }
})
