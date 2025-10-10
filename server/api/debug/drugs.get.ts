import connectDB from '~/server/utils/mongodb'
import Drug from '~/server/models/Drug'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  try {
    // Ищем эуфиллин
    const eufillinSearch = await Drug.find({
      $or: [
        { name: /эуфиллин/i },
        { name: /аминофиллин/i },
        { name: /aminophylline/i },
        { name: /eufillin/i },
        { name: /теофиллин/i },
        { latinName: /aminophylline/i },
        { latinName: /theophylline/i },
        { synonyms: /эуфиллин/i },
        { synonyms: /аминофиллин/i }
      ]
    })
    
    const totalDrugs = await Drug.countDocuments()
    const allDrugs = await Drug.find({}).limit(10).select('name latinName synonyms pediatricDose pediatricDoseUnit forms')
    
    return {
      success: true,
      eufillinFound: eufillinSearch.length,
      eufillinData: eufillinSearch,
      totalDrugs,
      sampleDrugs: allDrugs
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})
