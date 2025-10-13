import Drug from '~/server/models/Drug'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Drug ID is required'
      })
    }

    const drug = await Drug.findById(id)
    
    if (!drug) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Drug not found'
      })
    }

    return {
      success: true,
      data: drug
    }
  } catch (error: any) {
    console.error('Error fetching drug:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
