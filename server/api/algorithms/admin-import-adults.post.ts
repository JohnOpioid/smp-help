import { defineEventHandler } from 'h3'
import path from 'path'
import { promises as fs } from 'fs'
import * as cheerio from 'cheerio'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'

export default defineEventHandler(async () => {
  await connectDB()

  // 1) Очистить все алгоритмы раздела «Взрослые»
  await Algorithm.deleteMany({ section: 'Взрослые' })

  // 2) Пройти по папкам adults/* и создать/обновить категории, импортировать файлы
  const adultsDir = path.resolve(process.cwd(), 'public', 'adults')
  const section = 'Взрослые'
  const dirents = await fs.readdir(adultsDir, { withFileTypes: true })

  for (const dirent of dirents) {
    if (!dirent.isDirectory()) continue
    // Превращаем имя папки вида "1.anesthesiology" в url "anesthesiology"
    const categoryUrl = dirent.name.replace(/^\d+\./, '')

    // Обеспечить наличие категории
    let categoryDoc = await AlgorithmCategory.findOne({ url: categoryUrl }).lean()
    if (!categoryDoc) {
      // name формируем из URL (заменяем дефисы пробелами, капитализируем)
      const name = categoryUrl
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ')
      categoryDoc = (await AlgorithmCategory.create({ sections: [section], name, url: categoryUrl })).toObject()
    } else {
      // Убедимся, что раздел «Взрослые» присутствует в категории
      const set = new Set<string>([...(categoryDoc as any).sections || []])
      if (!set.has(section)) {
        await AlgorithmCategory.updateOne({ _id: (categoryDoc as any)._id }, { $addToSet: { sections: section } })
      }
    }

    const categoryPath = path.join(adultsDir, dirent.name)
    const files = await fs.readdir(categoryPath)

    // Отсортируем файлы по числовому префиксу перед первой точкой (например, 1.*, 2.*, 10.*)
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
      if (!file.endsWith('.html')) continue
      const fullPath = path.join(categoryPath, file)
      const html = await fs.readFile(fullPath, 'utf-8')

      const $ = cheerio.load(html)
      const title = $('h1').first().text().trim()
      // Извлекаем коды МКБ из span.mkbcc, разделяем по запятым и дефисам без нормализации пробелов
      const mkbText = $('span.mkbcc').first().text().trim()
      const mkbCodes = mkbText
        ? mkbText.split(',').map(s => s.trim()).filter(Boolean)
        : []

      // Собираем ВСЕ таблицы как HTML (с сохранением тегов)
      const tablesHtml: string[] = []
      $('table').each((_, el) => {
        tablesHtml.push($.html(el))
      })
      const content = tablesHtml.join('\n')

      // Добавляем алгоритм, если есть хотя бы заголовок
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


