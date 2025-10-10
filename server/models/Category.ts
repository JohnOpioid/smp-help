import mongoose from 'mongoose'

const { Schema, model, models } = mongoose as any

const CategorySchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  // Код класса из MKB JSON (например, "cl1", "cl2" ...)
  // Делаем уникальным и разрежённым, т.к. не у всех категорий обязательно должен быть код
  class: { type: String, unique: true, sparse: true, trim: true }
}, { timestamps: true })

export default models.Category || model('Category', CategorySchema)
