import connectDB from '~/server/utils/mongodb'
import AlgorithmSection from '~/server/models/AlgorithmSection'

export default defineEventHandler(async (event) => {
  await connectDB()

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required'
    })
  }

  if (event.method === 'GET') {
    const section = await AlgorithmSection.findById(id).lean()
    
    if (!section) {
      throw createError({
        statusCode: 404,
        message: 'Section not found'
      })
    }

    return {
      success: true,
      item: section
    }
  }

  if (event.method === 'PATCH') {
    const body = await readBody(event)
    
    const section = await AlgorithmSection.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).lean()

    if (!section) {
      throw createError({
        statusCode: 404,
        message: 'Section not found'
      })
    }

    return {
      success: true,
      item: section
    }
  }

  if (event.method === 'DELETE') {
    const section = await AlgorithmSection.findByIdAndDelete(id).lean()

    if (!section) {
      throw createError({
        statusCode: 404,
        message: 'Section not found'
      })
    }

    return {
      success: true,
      message: 'Section deleted successfully'
    }
  }

  throw createError({
    statusCode: 405,
    message: 'Method Not Allowed'
  })
})
