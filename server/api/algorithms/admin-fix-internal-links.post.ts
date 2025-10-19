import { defineEventHandler } from 'h3'
import * as cheerio from 'cheerio'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'

function stripNumberPrefix(s: string): string {
  return s.replace(/^\d+\./, '')
}
function mapSectionSlugToRu(slug?: string): 'Взрослые'|'Детские'|'ОНМП'|'ОНМП Дети'|undefined {
  if (!slug) return undefined
  const map: Record<string, any> = {
    adults: 'Взрослые',
    pediatrics: 'Детские',
    onmp: 'ОНМП',
    'onmp-children': 'ОНМП Дети'
  }
  return map[slug]
}

export default defineEventHandler(async () => {
  await connectDB()

  const all = await Algorithm.find({}, { content: 1, section: 1 }).lean()
  let changed = 0
  for (const doc of all) {
    const content = String((doc as any).content || '')
    if (!content || !content.includes('/algorithms/')) continue
    const $ = cheerio.load(content)
    let localChanged = false
    const anchors = $('a[href^="/algorithms/"]')
    for (const el of anchors.toArray()) {
      const a = $(el)
      const href = a.attr('href') || ''
      try {
        const url = new URL(href, 'http://localhost')
        const parts = url.pathname.split('/').filter(Boolean)
        if (parts[0] !== 'algorithms') continue
        const sectionSlug = parts[1]
        const sectionName = mapSectionSlugToRu(sectionSlug)
        if (!sectionName) continue
        const categoryFolder = parts[2]
        if (!categoryFolder) continue
        const categoryUrl = stripNumberPrefix(categoryFolder)

        let newHref = `/algorithms/${sectionSlug}/${categoryUrl}`
        if (parts.length >= 4) {
          // Попробуем найти алгоритм по названию в тексте ссылки (в скобках) в нужной категории и разделе
          const anchorText = (a.text() || '').trim()
          const m = anchorText.match(/\(([^)]+)\)/)
          const title = (m ? m[1] : anchorText).trim()
          if (title) {
            const category = await AlgorithmCategory.findOne({ url: categoryUrl }).lean()
            const catId = (category as any)?._id
            if (catId) {
              const list = await Algorithm.find({ category: catId, section: sectionName }, { _id: 1, title: 1 }).lean()
              const found = list.find((x: any) => String(x.title || '').toLowerCase() === title.toLowerCase())
                || list.find((x: any) => String(x.title || '').toLowerCase().includes(title.toLowerCase()))
              if (found?._id) newHref = `/algorithms/${sectionSlug}/${categoryUrl}/${found._id}`
            }
          }
        }
        if (href !== newHref) {
          a.attr('href', newHref)
          localChanged = true
        }
      } catch {}
    }
    if (localChanged) {
      const updated = $.root().html() || ''
      await Algorithm.updateOne({ _id: (doc as any)._id }, { $set: { content: updated } })
      changed++
    }
  }

  return { success: true, changed }
})


