import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Substation from '~/server/models/Substation'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  const { substationId, substationName, maxDistance = 3000 } = await readBody(event) // maxDistance в метрах (3км по умолчанию)
  
  if (!substationId && !substationName) {
    throw createError({
      statusCode: 400,
      message: 'ID или название подстанции обязательны'
    })
  }

  try {
    // Сначала находим исходную подстанцию
    let sourceSubstation
    if (substationId) {
      sourceSubstation = await Substation.findById(substationId)
    } else {
      sourceSubstation = await Substation.findOne({ name: substationName })
    }

    if (!sourceSubstation) {
      throw createError({
        statusCode: 404,
        message: 'Подстанция не найдена'
      })
    }

    if (!sourceSubstation.location?.coordinates) {
      throw createError({
        statusCode: 400,
        message: 'У подстанции отсутствуют координаты'
      })
    }

    const [sourceLng, sourceLat] = sourceSubstation.location.coordinates

    // Ищем ближайшие подстанции к исходной
    const nearbySubstations = await Substation.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [sourceLng, sourceLat]
          },
          distanceField: "distance",
          maxDistance: maxDistance,
          spherical: true
        }
      },
      {
        // Исключаем исходную подстанцию из результатов
        $match: {
          _id: { $ne: sourceSubstation._id }
        }
      },
      {
        $limit: 10 // Максимум 10 ближайших подстанций
      }
    ])

    // Добавляем расчет времени доезда между подстанциями
    const substationsWithTravelTime = nearbySubstations.map((substation: any) => {
      const distanceKm = substation.distance / 1000
      // Примерная скорость между подстанциями: 50 км/ч
      const estimatedTravelTimeMinutes = Math.round((distanceKm / 50) * 60)
      
      return {
        ...substation,
        distanceKm: Math.round(distanceKm * 10) / 10, // Округляем до 1 знака
        estimatedTravelTime: estimatedTravelTimeMinutes
      }
    })

    return {
      success: true,
      sourceSubstation: {
        id: sourceSubstation._id,
        name: sourceSubstation.name,
        address: sourceSubstation.address,
        coordinates: [sourceLat, sourceLng] // lat, lng для фронтенда
      },
      nearbySubstations: substationsWithTravelTime,
      searchRadius: maxDistance
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
