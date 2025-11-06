import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Classroom from '~/server/models/Classroom'

export default defineEventHandler(async (event) => {
  await connectDB()
  const section = getRouterParam(event, 'section') || ''
  if (!section) return { success: false, message: 'section is required' }
  let doc = await Classroom.findOne({ section }).lean()
  if (!doc) {
    // создаём пустую запись по умолчанию
    let data: any = {}
    if (section === 'airway') {
      const empty = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
      data = { children: empty, adults: empty }
    }
    doc = (await Classroom.create({ section, title: section.toUpperCase(), data })).toObject()
  }
  return { success: true, item: doc }
})


