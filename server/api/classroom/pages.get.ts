import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomList from '~/server/models/ClassroomList'
import ClassroomAirway from '~/server/models/ClassroomAirway'
import ClassroomCpr from '~/server/models/ClassroomCpr'

export default defineEventHandler(async () => {
  await connectDB()
  const [lists, airways, cprs] = await Promise.all([
    ClassroomList.find({}, { _id: 0, title: 1, slug: 1, description: 1, order: 1, icon: 1 }).lean(),
    ClassroomAirway.find({}, { _id: 0, title: 1, slug: 1, description: 1, order: 1, icon: 1 }).lean(),
    ClassroomCpr.find({}, { _id: 0, title: 1, slug: 1, order: 1, icon: 1 }).lean()
  ])
  const items = [
    ...lists.map((x: any) => ({ type: 'list', title: x.title, slug: x.slug, description: x.description || '', order: x.order || 0, icon: x.icon || '' })),
    ...cprs.map((x: any) => ({ type: 'table', title: x.title, slug: x.slug, description: '', order: x.order || 0, icon: x.icon || '' })),
    ...airways.map((x: any) => ({ type: 'scheme', title: x.title, slug: x.slug, description: x.description || '', order: x.order || 0, icon: x.icon || '' }))
  ].sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title))
  return { success: true, items }
})


