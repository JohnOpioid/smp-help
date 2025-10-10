import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import Substation from '~/server/models/Substation'
import Category from '~/server/models/Category'
import MKB from '~/server/models/MKB'
import Instruction from '~/server/models/Instruction'
import LocalStatus from '~/server/models/LocalStatus'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'

export default defineEventHandler(async () => {
  await connectDB()

  const [
    totalUsers,
    usersByRole,
    usersBySubstation,
    totalSubstations,
    totalCategories,
    totalMkb,
    totalInstructions,
    totalLocalStatus,
    totalLocalStatusCategories,
  ] = await Promise.all([
    User.countDocuments({}),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { role: '$_id', _id: 0, count: 1 } },
      { $sort: { count: -1 } }
    ]),
    User.aggregate([
      { $match: { substation: { $exists: true, $ne: '' } } },
      { $group: { _id: '$substation', count: { $sum: 1 } } },
      { $project: { substation: '$_id', _id: 0, count: 1 } },
      { $sort: { count: -1 } }
    ]),
    Substation.countDocuments({}),
    Category.countDocuments({}),
    MKB.countDocuments({}),
    Instruction.countDocuments({}),
    LocalStatus.countDocuments({}),
    LocalStatusCategory.countDocuments({})
  ])

  // Топ-10 подстанций и пользователей
  const topSubstations = usersBySubstation.slice(0, 10)

  return {
    success: true,
    stats: {
      users: {
        total: totalUsers,
        byRole: usersByRole,
        bySubstation: usersBySubstation,
        topSubstations
      },
      substations: { total: totalSubstations },
      codifier: { categories: totalCategories, mkb: totalMkb },
      localStatuses: { categories: totalLocalStatusCategories, items: totalLocalStatus },
      instructions: { total: totalInstructions }
    }
  }
})


