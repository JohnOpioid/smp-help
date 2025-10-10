import { defineEventHandler } from 'h3'
import path from 'path'
import { promises as fs } from 'fs'
import * as cheerio from 'cheerio'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'

function normalizeCategoryUrl(dirName: string): string {
  return dirName.replace(/^\d+\./, '')
}

export default defineEventHandler(async () => {
  await connectDB()

  const section = 'Детские'
  const baseDir = path.resolve(process.cwd(), 'public', 'pediatrics')

  // Очистить только детские алгоритмы
  await Algorithm.deleteMany({ section })

  const dirents = await fs.readdir(baseDir, { withFileTypes: true })
  for (const dirent of dirents) {
    if (!dirent.isDirectory()) continue
    const originalName = dirent.name
    const categoryUrl = normalizeCategoryUrl(originalName)

    // Найти существующую категорию строго по url и наличию раздела «Детские»
    const categoryDoc = await AlgorithmCategory.findOne({ url: categoryUrl, sections: { $in: [section] } }).lean()
    if (!categoryDoc) {
      // Категории создавать нельзя — пропускаем эту папку
      continue
    }

    const categoryPath = path.join(baseDir, originalName)
    const files = await fs.readdir(categoryPath)

    // Сортируем файлы по числовому префиксу (1.*, 2.*, 10.*)
    const parsed = files
      .filter(f => f.endsWith('.html'))
      .map(file => {
        const m = file.match(/^(\d+)/)
        const num = m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY
        return { file, num }
      })
      .sort((a, b) => (a.num - b.num) || a.file.localeCompare(b.file))

    for (let idx = 0; idx < parsed.length; idx++) {
      const { file, num } = parsed[idx]
      const fullPath = path.join(categoryPath, file)
      const html = await fs.readFile(fullPath, 'utf-8')

      const $ = cheerio.load(html)
      const title = $('h1').first().text().trim()
      const mkbText = $('span.mkbcc').first().text().trim()
      const mkbCodes = mkbText ? mkbText.split(',').map(s => s.trim()).filter(Boolean) : []

      const tablesHtml: string[] = []
      $('table').each((_, el) => { tablesHtml.push($.html(el)) })
      const content = tablesHtml.join('\n')

      await Algorithm.create({
        category: (categoryDoc as any)._id,
        section,
        title,
        order: Number.isFinite(num) ? num : (idx + 1),
        mkbCodes,
        content
      })
    }
  }

  return { success: true }
})


