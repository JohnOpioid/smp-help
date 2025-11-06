import mongoose from 'mongoose'
const { Schema, model, models } = mongoose as any

const ClassroomListFieldSchema = new Schema({
  type: { type: String, enum: ['input', 'textarea'], required: true },
  label: { type: String, default: '' },
  value: { type: String, default: '' }
}, { _id: true })

const ClassroomListItemSchema = new Schema({
  title: { type: String, required: true, trim: true },
  // Поля старого формата для обратной совместимости
  code: { type: String, trim: true },
  description: { type: String, default: '' },
  // Новый формат: произвольные поля
  fields: { type: [ClassroomListFieldSchema], default: [] }
}, { _id: true })

const ClassroomListSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  items: { type: [ClassroomListItemSchema], default: [] },
  order: { type: Number, default: 0 }
}, { timestamps: true })

export default models.ClassroomList || model('ClassroomList', ClassroomListSchema)


