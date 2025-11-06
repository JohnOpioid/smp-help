import mongoose from 'mongoose'
const { Schema, model, models } = mongoose as any

const CprRowSchema = new Schema({
  stage: { type: String, required: true },
  adults: { type: String, required: true },
  children: { type: String, required: true },
  newborns: { type: String, required: true }
}, { _id: false })

const ClassroomCprSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  icon: { type: String, default: '' },
  // Новый универсальный формат таблицы
  grid: { type: Schema.Types.Mixed, default: [] }, // массив строк с ячейками { value, colspan, rowspan, hidden }
  merges: { type: [Schema.Types.Mixed], default: [] }, // резерв под будущие операции
  columns: { type: Number, default: 0 },
  // Совместимость со старым форматом
  rows: { type: [CprRowSchema], default: [] },
  notes: { type: [String], default: [] },
  order: { type: Number, default: 0 }
}, { timestamps: true })

export default models.ClassroomCpr || model('ClassroomCpr', ClassroomCprSchema)


