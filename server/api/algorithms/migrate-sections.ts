import connectDB from '~/server/utils/mongodb'
import AlgorithmSection from '~/server/models/AlgorithmSection'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'
import Algorithm from '~/server/models/Algorithm'

export default defineEventHandler(async (event) => {
  await connectDB()

  try {
    // Создаем разделы
    const sections = [
      { name: 'Взрослые', url: 'adults', description: 'Алгоритмы для взрослых пациентов' },
      { name: 'Детские', url: 'pediatrics', description: 'Алгоритмы для детских пациентов' },
      { name: 'ОНМП', url: 'onmp', description: 'Алгоритмы неотложной помощи' },
      { name: 'ОНМП Дети', url: 'onmp-children', description: 'Алгоритмы детской неотложной помощи' }
    ]

    const createdSections = []
    for (const sectionData of sections) {
      let section = await AlgorithmSection.findOne({ url: sectionData.url })
      if (!section) {
        section = new AlgorithmSection(sectionData)
        await section.save()
        createdSections.push(section)
      } else {
        createdSections.push(section)
      }
    }

    // Создаем маппинг старых названий разделов на новые ID
    const sectionMapping: Record<string, string> = {
      'Взрослые': createdSections.find(s => s.url === 'adults')?._id.toString() || '',
      'Детские': createdSections.find(s => s.url === 'pediatrics')?._id.toString() || '',
      'ОНМП': createdSections.find(s => s.url === 'onmp')?._id.toString() || '',
      'ОНМП Дети': createdSections.find(s => s.url === 'onmp-children')?._id.toString() || ''
    }

    // Обновляем категории
    const categories = await AlgorithmCategory.find({})
    for (const category of categories) {
      if (Array.isArray(category.sections) && category.sections.length > 0) {
        const newSections = category.sections
          .map((s: string) => sectionMapping[s])
          .filter(Boolean)
        
        if (newSections.length > 0) {
          await AlgorithmCategory.findByIdAndUpdate(category._id, { sections: newSections })
        }
      }
    }

    // Обновляем алгоритмы
    const algorithms = await Algorithm.find({})
    for (const algorithm of algorithms) {
      if (typeof algorithm.section === 'string') {
        const sectionId = sectionMapping[algorithm.section]
        if (sectionId) {
          await Algorithm.findByIdAndUpdate(algorithm._id, { section: sectionId })
        }
      }
    }

    return {
      success: true,
      message: 'Migration completed successfully',
      createdSections: createdSections.length,
      updatedCategories: categories.length,
      updatedAlgorithms: algorithms.length
    }
  } catch (error) {
    console.error('Migration error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Migration failed: ' + error.message
    })
  }
})
