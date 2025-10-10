import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Drug from '~/server/models/Drug'
import DrugCategory from '~/server/models/DrugCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { name, latinName, synonyms, forms, pediatricDose, pediatricDoseUnit, ageRestrictions, indications, contraindications, adverse, interactions, antidotes, description, doses, categories } = body || {}
  if (!name) return { success: false, message: 'Название обязательно' }
  const safeForms = forms ? {
    doseValue: Number(forms?.doseValue) || undefined,
    doseUnit: (forms?.doseUnit || '').toString().trim() || undefined,
    volumeMl: Number(forms?.volumeMl) || undefined
  } : undefined
  const safePediatric = Array.isArray(pediatricDose)
    ? pediatricDose.map((s: any) => (s ?? '').toString().trim()).filter((s: string) => s.length)
    : ((pediatricDose ?? '').toString().trim() ? [(pediatricDose ?? '').toString().trim()] : [])
  // Synonyms: поддержка строки через запятую и массива
  const safeSynonyms = Array.isArray(synonyms)
    ? synonyms.map((s: any) => (s ?? '').toString().trim()).filter((s: string) => s.length)
    : (typeof synonyms === 'string'
      ? synonyms.split(',').map(s => s.trim()).filter(Boolean)
      : ((synonyms ?? '').toString().trim() ? [(synonyms ?? '').toString().trim()] : []))

  // Categories: поддержка массива имён/URL/ID
  let categoryIds: string[] = []
  if (Array.isArray(categories)) {
    for (const c of categories) {
      const token = (c ?? '').toString().trim()
      if (!token) continue
      let docCat = await DrugCategory.findOne({ $or: [{ _id: token }, { url: token }, { name: token }] }).lean()
      if (!docCat) {
        // создаём по имени
        const url = token.toLowerCase()
        const created = await DrugCategory.create({ name: token, url })
        docCat = created.toObject()
      }
      categoryIds.push(String(docCat._id))
    }
  }

  const doc = await Drug.create({ name, latinName, synonyms: safeSynonyms, categories: categoryIds, forms: safeForms, pediatricDose: safePediatric, pediatricDoseUnit, ageRestrictions, indications, contraindications, adverse, interactions, antidotes, description, doses })
  return { success: true, item: doc }
})


