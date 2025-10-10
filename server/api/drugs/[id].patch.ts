import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Drug from '~/server/models/Drug'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const body = await readBody(event)
  // нормализация pediatricDose и synonyms
  const safeBody: any = { ...body }
  if ('pediatricDose' in safeBody) {
    const pd = safeBody.pediatricDose
    safeBody.pediatricDose = Array.isArray(pd)
      ? pd.map((s: any) => (s ?? '').toString().trim()).filter((s: string) => s.length)
      : ((pd ?? '').toString().trim() ? [(pd ?? '').toString().trim()] : [])
  }
  if ('synonyms' in safeBody) {
    const syn = safeBody.synonyms
    safeBody.synonyms = Array.isArray(syn)
      ? syn.map((s: any) => (s ?? '').toString().trim()).filter((s: string) => s.length)
      : ((syn ?? '').toString().trim() ? [(syn ?? '').toString().trim()] : [])
  }
  const updated = await Drug.findByIdAndUpdate(id, safeBody, { new: true, runValidators: true })
  if (!updated) return { success: false, message: 'Препарат не найден' }
  return { success: true, item: updated }
})


