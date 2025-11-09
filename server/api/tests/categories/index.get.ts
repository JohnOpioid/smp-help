import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import TestCategory from '~/server/models/TestCategory'
import Test from '~/server/models/Test'

export default defineEventHandler(async (event) => {
  await connectDB()
  const url = new URL(event.node.req.url || '', 'http://localhost')
  const publicOnly = url.searchParams.get('publicOnly')
  const query: any = {}
  if (publicOnly === '1') query.isPublic = true
  const items = await TestCategory.find(query).sort({ createdAt: -1 }).lean()
  
  // Проверяем наличие неодобренных предложений для каждой категории
  // Предложение считается неодобренным, если поле suggestion существует и не null
  const itemsWithSuggestions = await Promise.all(items.map(async (cat: any) => {
    const hasSuggestions = await Test.exists({ 
      category: cat._id, 
      suggestion: { $exists: true, $ne: null },
      'suggestion.question': { $exists: true, $ne: null }
    })
    return { ...cat, hasSuggestions: Boolean(hasSuggestions) }
  }))
  
  return { success: true, items: itemsWithSuggestions }
})



