import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKBCategory from '~/server/models/MKBCategory'
import MKB from '~/server/models/MKB'

export default defineEventHandler(async () => {
  await connectDB()
  
  const categories = await MKBCategory.find({}).sort({ createdAt: 1 }).lean()
  
  // Получаем количество МКБ кодов для каждой категории
  let categoriesWithCounts = await Promise.all(
    categories.map(async (category: any) => {
      const mkbCount = await MKB.countDocuments({ category: category._id })
      // Диапазон кодов для отображения, например A00-A99
      const first = await MKB.findOne({ category: category._id }).sort({ mkbCode: 1 }).select('mkbCode').lean()
      const last = await MKB.findOne({ category: category._id }).sort({ mkbCode: -1 }).select('mkbCode').lean()
      const codeRange = first?.mkbCode && last?.mkbCode ? `${first.mkbCode.split('.')[0]}-${last.mkbCode.split('.')[0]}` : null
      return {
        ...category,
        name: String(category.name || '').replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim(),
        mkbCount,
        codeRange
      }
    })
  )
  // Сортировка: clUnresult всегда в конце
  categoriesWithCounts = categoriesWithCounts.sort((a: any, b: any) => {
    const aIsUnres = String(a.class || '') === 'clUnresult'
    const bIsUnres = String(b.class || '') === 'clUnresult'
    if (aIsUnres && !bIsUnres) return 1
    if (!aIsUnres && bIsUnres) return -1
    return 0
  })
  
  return { success: true, items: categoriesWithCounts }
})
