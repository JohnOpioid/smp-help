import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import Substation from '~/server/models/Substation'
import MKBCategory from '~/server/models/MKBCategory'
import MKB from '~/server/models/MKB'
import Instruction from '~/server/models/Instruction'
import LocalStatus from '~/server/models/LocalStatus'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'
import Calculator from '~/server/models/Calculator'
import Algorithm from '~/server/models/Algorithm'
import Drug from '~/server/models/Drug'
import ClassroomList from '~/server/models/ClassroomList'
import ClassroomAirway from '~/server/models/ClassroomAirway'
import ClassroomCpr from '~/server/models/ClassroomCpr'

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
    totalCalculators,
    totalAlgorithms,
    totalDrugs,
    totalClassroomLists,
    totalClassroomAirways,
    totalClassroomCprs
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
    MKBCategory.countDocuments({}),
    MKB.countDocuments({}),
    Instruction.countDocuments({}),
    LocalStatus.countDocuments({}),
    LocalStatusCategory.countDocuments({}),
    Calculator.countDocuments({}),
    Algorithm.countDocuments({}),
    Drug.countDocuments({}),
    ClassroomList.countDocuments({}),
    ClassroomAirway.countDocuments({}),
    ClassroomCpr.countDocuments({})
  ])

  // Базовые разделы: Инструкции, СЛР, Проходимость дыхательных путей (всегда есть)
  const baseSectionsCount = 3
  const totalClassroomPages = totalClassroomLists + totalClassroomAirways + totalClassroomCprs + baseSectionsCount

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
      instructions: { total: totalInstructions },
      calculators: { total: totalCalculators },
      algorithms: { total: totalAlgorithms },
      drugs: { total: totalDrugs },
      classroom: { total: totalClassroomPages }
    }
  }
})


