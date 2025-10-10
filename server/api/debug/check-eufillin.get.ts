import connectDB from '~/server/utils/mongodb'
import Drug from '~/server/models/Drug'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  try {
    // Ищем эуфиллин всеми возможными способами
    const searchTerms = ['эуфиллин', 'аминофиллин', 'aminophylline', 'eufillin', 'теофиллин', 'theophylline']
    
    const results = []
    
    for (const term of searchTerms) {
      const drugs = await Drug.find({
        $or: [
          { name: new RegExp(term, 'i') },
          { latinName: new RegExp(term, 'i') },
          { synonyms: new RegExp(term, 'i') },
          { description: new RegExp(term, 'i') }
        ]
      }).select('name latinName synonyms pediatricDose pediatricDoseUnit forms ageRestrictions')
      
      if (drugs.length > 0) {
        results.push({
          searchTerm: term,
          found: drugs.length,
          drugs: drugs
        })
      }
    }
    
    // Также проверим общий поиск по "эуфиллин"
    const generalSearch = await Drug.find({
      $text: { $search: 'эуфиллин' }
    }).catch(() => []) // Если нет текстового индекса
    
    const allDrugs = await Drug.find({}).limit(5).select('name latinName synonyms')
    
    return {
      success: true,
      searchResults: results,
      generalSearch: generalSearch.length,
      totalDrugs: await Drug.countDocuments(),
      sampleDrugs: allDrugs,
      message: results.length > 0 ? 'Эуфиллин найден!' : 'Эуфиллин не найден в БД'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})
