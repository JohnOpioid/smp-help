import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import { requireAdmin } from '~/server/utils/auth'
import DrugCategory from '~/server/models/DrugCategory'
import Drug from '~/server/models/Drug'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { slugifyForUrl } from '~/server/utils/textNormalization'

type YamlDrug = {
  id?: string
  russian_name?: string
  latin_name?: string
  group?: string
  group_type?: string
  mechanism?: string[]
  indications?: string[]
  dosages?: any
  antidote?: any
  pharmacokinetics?: any
  contraindications?: string[]
  side_effects?: string[]
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const yamlPath = resolve(process.cwd(), 'public', 'drugs.yaml')

  // Load js-yaml via CommonJS require to avoid ESM loader issues on Windows
  const require = createRequire(import.meta.url)
  const jsYaml = require('js-yaml') as typeof import('js-yaml')

  const raw = await readFile(yamlPath, 'utf-8')
  const parsed: any = jsYaml.load(raw)
  const items: YamlDrug[] = Array.isArray(parsed?.drugs) ? parsed.drugs : []

  if (!items.length) {
    return { success: false, message: 'В файле drugs.yaml не найдены препараты (ключ drugs)' }
  }

  // 1) Собираем категории из поля group
  const groupNames = Array.from(new Set(
    items.flatMap(d => (d.group || '').toString().split(',').map(s => s.trim())).filter(Boolean)
  ))

  const categoryMap = new Map<string, string>() // name -> _id
  for (const name of groupNames) {
    const url = slugifyForUrl(name)
    const cat = await DrugCategory.findOneAndUpdate(
      { url },
      { name, url },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    categoryMap.set(name, String(cat._id))
  }

  // 2) Импортируем препараты
  let upserted = 0
  for (const d of items) {
    const rawName = (d.russian_name || '').toString().trim()
    if (!rawName) continue
    const [primaryName, ...syns] = rawName.split(',').map(s => s.trim()).filter(Boolean)
    const name = primaryName
    const latinName = (d.latin_name || '').toString().trim() || undefined
    const categoryIds = (d.group || '').toString().split(',').map((s: string) => s.trim()).filter(Boolean).map((n: string) => categoryMap.get(n)).filter(Boolean)

    // Механизм как отдельный массив, описание не заполняем автоматически
    const mechanism = Array.isArray(d.mechanism) ? d.mechanism : undefined

    const indications = Array.isArray(d.indications) ? d.indications : undefined
    const contraindications = Array.isArray(d.contraindications) ? d.contraindications : undefined
    const adverse = Array.isArray(d.side_effects) ? d.side_effects : undefined
    const antidote = d.antidote || undefined
    const dosages = d.dosages || undefined
    const pharmacokinetics = d.pharmacokinetics || undefined

    await Drug.findOneAndUpdate(
      { name },
      {
        name,
        latinName,
        categories: categoryIds,
        synonyms: syns,
        mechanism,
        indications,
        contraindications,
        adverse,
        antidote,
        dosages,
        pharmacokinetics
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    upserted++
  }

  return { success: true, categoriesCreated: categoryMap.size, drugsUpserted: upserted }
})


