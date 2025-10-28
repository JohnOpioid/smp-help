import { defineEventHandler } from 'h3'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import connectDB from '~/server/utils/mongodb'
import Calculator from '~/server/models/Calculator'

interface CalculatorFile {
  fileName: string
  url: string
  filePath: string
  exists: boolean
  inDatabase: boolean
  dbData?: any
}

export default defineEventHandler(async (event) => {
  try {
    // Подключаемся к БД
    await connectDB()

    // Получаем путь к директории pages/calculators
    const projectRoot = process.cwd()
    const calculatorsDir = join(projectRoot, 'pages', 'calculators')
    
    // Получаем список файлов
    const files = await readdir(calculatorsDir)
    
    // Фильтруем только .vue файлы (исключаем index.vue)
    const calculatorFiles = files
      .filter(file => file.endsWith('.vue') && file !== 'index.vue')
      .map(file => {
        const fileName = file.replace('.vue', '')
        const url = `/calculators/${fileName}`
        return {
          fileName,
          url,
          filePath: join(calculatorsDir, file)
        }
      })

    // Проверяем существование файлов и наличие в БД
    const calculatorsWithStatus: CalculatorFile[] = await Promise.all(
      calculatorFiles.map(async (calc) => {
        try {
          const stats = await stat(calc.filePath)
          const exists = stats.isFile()
          
          // Проверяем, есть ли в БД
          const dbCalculator = await Calculator.findOne({ url: calc.url }).lean()
          
          return {
            fileName: calc.fileName,
            url: calc.url,
            filePath: calc.filePath,
            exists,
            inDatabase: !!dbCalculator,
            dbData: dbCalculator || null
          }
        } catch (error) {
          return {
            fileName: calc.fileName,
            url: calc.url,
            filePath: calc.filePath,
            exists: false,
            inDatabase: false,
            dbData: null
          }
        }
      })
    )

    // Получаем все калькуляторы из БД для статистики
    const dbCalculators = await Calculator.find({}).lean()
    
    return {
      success: true,
      calculators: calculatorsWithStatus,
      stats: {
        totalFiles: calculatorsWithStatus.length,
        inDatabase: calculatorsWithStatus.filter(c => c.inDatabase).length,
        notInDatabase: calculatorsWithStatus.filter(c => !c.inDatabase).length,
        totalInDB: dbCalculators.length
      }
    }
  } catch (error: any) {
    console.error('Ошибка получения списка калькуляторов:', error)
    return {
      success: false,
      error: error.message,
      calculators: [],
      stats: {
        totalFiles: 0,
        inDatabase: 0,
        notInDatabase: 0,
        totalInDB: 0
      }
    }
  }
})

