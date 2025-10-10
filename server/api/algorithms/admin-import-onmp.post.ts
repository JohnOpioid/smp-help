import { defineEventHandler } from 'h3'
import path from 'path'
import { promises as fs } from 'fs'
import * as cheerio from 'cheerio'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'

function dirNum(name: string): number | null {
  const m = name.match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : null
}
function dirUrl(name: string): string {
  return name.replace(/^\d+\./, '')
}

export default defineEventHandler(async () => {
  await connectDB()

  const baseDir = path.resolve(process.cwd(), 'public', 'onmp')
  const dirents = await fs.readdir(baseDir, { withFileTypes: true })

  // Чистим оба раздела перед импортом
  await Algorithm.deleteMany({ section: { $in: ['ОНМП', 'ОНМП Дети'] } })

  for (const dirent of dirents) {
    if (!dirent.isDirectory()) continue
    const dn = dirNum(dirent.name)
    if (dn == null) continue

    let section: 'ОНМП' | 'ОНМП Дети' | null = null
    if (dn >= 1 && dn <= 14) section = 'ОНМП'
    else if (dn >= 16 && dn <= 28) section = 'ОНМП Дети'
    else section = null
    if (!section) continue

    const categoryUrl = dirUrl(dirent.name)

    // Категория по URL
    let categoryDoc = await AlgorithmCategory.findOne({ url: categoryUrl }).lean()
    if (!categoryDoc) {
      const name = categoryUrl
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ')
      categoryDoc = (await AlgorithmCategory.create({ sections: [section], name, url: categoryUrl })).toObject()
    } else {
      // Убедиться, что раздел присутствует
      const has = ((categoryDoc as any).sections || []).includes(section)
      if (!has) await AlgorithmCategory.updateOne({ _id: categoryDoc._id }, { $addToSet: { sections: section } })
    }

    const categoryPath = path.join(baseDir, dirent.name)
    const files = await fs.readdir(categoryPath)
    const parsed = files
      .filter(f => f.endsWith('.html'))
      .map(file => {
        const m = file.match(/^(\d+)/)
        const num = m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY
        return { file, num }
      })
      .sort((a, b) => (a.num - b.num) || a.file.localeCompare(b.file))

    // Порядок начинаем с 1 для каждой категории внутри раздела
    let orderCounter = 1
    for (const { file } of parsed) {
      const fullPath = path.join(categoryPath, file)
      const html = await fs.readFile(fullPath, 'utf-8')
      const $ = cheerio.load(html)
      const title = $('h1').first().text().trim() // Название без тегов
      // Все таблицы как HTML (конкатенация)
      const tablesHtml: string[] = []
      $('table').each((_, el) => { tablesHtml.push($.html(el)) })
      const content = tablesHtml.join('\n')

      // mkbCodes (если есть в onmp таком же формате)
      const mkbText = $('span.mkbcc').first().text().trim()
      const mkbCodes = mkbText ? mkbText.split(',').map(s => s.trim()).filter(Boolean) : []

      if (!title && !content) continue
      await Algorithm.create({
        category: (categoryDoc as any)._id,
        section,
        title: title || 'Без названия',
        content,
        mkbCodes,
        order: orderCounter++
      })
    }
  }

  return { success: true }
})


