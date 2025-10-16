import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import { embedTexts } from '~/server/utils/ai/embeddings'
import { getOrCreateCollection } from '~/server/utils/ai/chroma'
import MKB from '~/server/models/MKB'
import LocalStatus from '~/server/models/LocalStatus'
import Algorithm from '~/server/models/Algorithm'
import Drug from '~/server/models/Drug'
import Substation from '~/server/models/Substation'

type PrepItem = { id: string; document: string; metadata: Record<string, any> }

function toPlain(text: unknown): string {
  if (!text) return ''
  return String(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function indexCollection(name: string, items: PrepItem[]) {
  if (items.length === 0) return { name, added: 0 }
  const collection = await getOrCreateCollection(name)
  const batchSize = 64
  let added = 0
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const texts = batch.map(b => b.document || '')
    let vectors = await embedTexts(texts)
    // Страховка: при несовпадении длины пересчитываем по одному
    if (!Array.isArray(vectors) || vectors.length !== texts.length) {
      const singleVectors: number[][] = []
      for (const t of texts) {
        const v = await embedTexts([t])
        singleVectors.push(v[0] || [])
      }
      vectors = singleVectors
    }
    await collection.upsert({
      ids: batch.map(b => String(b.id)),
      documents: texts,
      embeddings: vectors,
      metadatas: batch.map(b => (b.metadata || {}))
    })
    added += batch.length
  }
  return { name, added }
}

export default defineEventHandler(async () => {
  await connectDB()

  const [mkbDocs, lsDocs, algoDocs, drugDocs, substationDocs] = await Promise.all([
    MKB.find({}).populate('category', 'name url').lean(),
    LocalStatus.find({}).populate('category', 'name url').lean(),
    Algorithm.find({}).populate('category', 'name url').populate('section', 'name url').lean(),
    Drug.find({}).populate('categories', 'name url').lean(),
    Substation.find({}).populate('region', 'name').lean()
  ])

  const mkbItems: PrepItem[] = mkbDocs.map((d: any) => ({
    id: String(d._id),
    document: [toPlain(d.mkbCode), toPlain(d.title), toPlain(d.description), toPlain(d.note)].join(' ').trim(),
    metadata: { type: 'mkb', categoryUrl: d.category?.url || null }
  }))

  const lsItems: PrepItem[] = lsDocs.map((d: any) => ({
    id: String(d._id),
    document: [toPlain(d.title), toPlain(d.description), toPlain(d.note), toPlain(d.localis)].join(' ').trim(),
    metadata: { type: 'ls', categoryUrl: d.category?.url || null }
  }))

  const algoItems: PrepItem[] = algoDocs.map((d: any) => ({
    id: String(d._id),
    document: [toPlain(d.title), toPlain(d.description), toPlain(d.content)].join(' ').trim(),
    metadata: { type: 'algorithm', categoryUrl: d.category?.url || null, sectionUrl: d.section?.url || null }
  }))

  const drugItems: PrepItem[] = drugDocs.map((d: any) => ({
    id: String(d._id),
    document: [toPlain(d.name), toPlain(d.description), toPlain(d.dosage), toPlain(d.analogues)].join(' ').trim(),
    metadata: { type: 'drug' }
  }))

  const substationItems: PrepItem[] = substationDocs.map((d: any) => ({
    id: String(d._id),
    document: [toPlain(d.name), toPlain(d.address), toPlain(d.description)].join(' ').trim(),
    metadata: { type: 'substation', region: d.region?.name || null }
  }))

  const [mkbRes, lsRes, algoRes, drugRes, substationRes] = await Promise.all([
    indexCollection('mkb', mkbItems),
    indexCollection('local_statuses', lsItems),
    indexCollection('algorithms', algoItems),
    indexCollection('drugs', drugItems),
    indexCollection('substations', substationItems)
  ])

  return { success: true, stats: { mkbRes, lsRes, algoRes, drugRes, substationRes } }
})



