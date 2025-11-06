import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Classroom from '~/server/models/Classroom'

export default defineEventHandler(async () => {
  await connectDB()
  const doc = await Classroom.findOne({ section: 'airway' })
  if (!doc) return { success: false, message: 'airway not found' }

  function fixGroup(group: any) {
    if (!group?.nodes) return
    for (const n of group.nodes) {
      // Исправляем перепутанные параметры тона/текста
      if (typeof n?.data?.tone !== 'string') {
        // типично: bodyMd === 'pink', tone === 520
        if (n?.data?.bodyMd === 'pink') n.data.bodyMd = ''
        n.data.tone = 'pink'
      }
      // Исправляем отсутствующую координату y
      if (!n?.position || n.position.y == null) {
        // Пробуем по заголовку определить желаемую позицию
        if (String(n?.data?.title || '').toLowerCase().includes('суксаметония')) {
          n.position = { x: 520, y: 420 }
        } else if (!n.position) {
          n.position = { x: 0, y: 0 }
        } else {
          n.position.y = 0
        }
      }
      // Гарантируем тип узла
      if (!n.type) n.type = 'block'
    }
  }

  const data: any = doc.data || {}
  fixGroup(data.children)
  fixGroup(data.adults)

  doc.markModified('data')
  await doc.save()
  // @ts-ignore
  return { success: true, item: doc.toObject ? doc.toObject() : doc }
})


