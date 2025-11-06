import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Classroom from '~/server/models/Classroom'

export default defineEventHandler(async (event) => {
  await connectDB()
  const section = getRouterParam(event, 'section') || ''
  if (!section) return { success: false, message: 'section is required' }
  const body = await readBody(event)
  
  // ВАЖНО: Используем findOne и save() для правильного сохранения вложенных объектов
  let doc = await Classroom.findOne({ section })
  if (!doc) {
    doc = new Classroom({ section })
  }
  
  if (body?.title != null) doc.title = body.title
  if (body?.data != null) {
    // ВАЖНО: Создаем глубокую копию данных для правильного отслеживания изменений
    // Используем JSON для сериализации/десериализации
    doc.data = JSON.parse(JSON.stringify(body.data))
    // ВАЖНО: Явно отмечаем вложенный объект как измененный для Mongoose
    // Это критично для Mixed типов с глубокой вложенностью
    doc.markModified('data')
    // Также отмечаем вложенные свойства если они есть
    if (body.data.children) doc.markModified('data.children')
    if (body.data.adults) doc.markModified('data.adults')
  }
  if (body?.order != null) doc.order = body.order
  
  await doc.save()
  
  // Возвращаем обновленный документ
  const updated = await Classroom.findOne({ section }).lean()
  return { success: true, item: updated }
})


