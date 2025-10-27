import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    return { success: false, item: null }
  }
  
  const category = await AlgorithmCategory.findById(id).lean()
  
  return { success: true, item: category }
})

