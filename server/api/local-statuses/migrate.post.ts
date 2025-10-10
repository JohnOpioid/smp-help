import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'
import Category from '~/server/models/Category'

// Одноразовая миграция: если LocalStatus.category указывает на старую модель Category,
// обновляем ссылку на соответствующую LocalStatusCategory по совпадению имени.
export default defineEventHandler(async () => {
  await connectDB()

  const statuses = await LocalStatus.find({}).populate('category').lean()
  let updated = 0
  for (const st of statuses) {
    const cat: any = st.category
    const isOldRef = cat && cat._id && cat.url !== undefined && (cat as any)._bsontype === undefined
    // Если категория не из коллекции LocalStatusCategory, пробуем найти соответствующую по имени
    if (cat && (!('collection' in cat) || (cat as any).collection?.name === (Category as any).collection?.name)) {
      const target = await LocalStatusCategory.findOne({ name: cat.name }).lean()
      if (target) {
        await LocalStatus.updateOne({ _id: st._id }, { $set: { category: target._id } })
        updated++
      }
    }
  }

  return { success: true, updated }
})


