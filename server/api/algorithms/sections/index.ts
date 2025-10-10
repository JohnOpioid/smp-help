import connectDB from '~/server/utils/mongodb'
import AlgorithmSection from '~/server/models/AlgorithmSection'

export default defineEventHandler(async (event) => {
  await connectDB()

  if (event.method === 'GET') {
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 100
    const search = query.search as string || ''

    const filter: any = {}
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      AlgorithmSection.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AlgorithmSection.countDocuments(filter)
    ])

    return {
      success: true,
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    
    const section = new AlgorithmSection(body)
    await section.save()

    return {
      success: true,
      item: section
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed'
  })
})
