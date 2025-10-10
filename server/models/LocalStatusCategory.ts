import mongoose from 'mongoose'

const { Schema, model, models } = mongoose as any

const LocalStatusCategorySchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 1 },
  url: { type: String, required: true, unique: true }
}, { timestamps: true })

export default models.LocalStatusCategory || model('LocalStatusCategory', LocalStatusCategorySchema)


