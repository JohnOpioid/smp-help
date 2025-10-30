import mongoose from 'mongoose'

const { Schema, model, models } = mongoose as any

const TestCategorySchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 1 },
  url: { type: String, required: true, unique: true },
  description: { type: String }
}, { timestamps: true })

export default models.TestCategory || model('TestCategory', TestCategorySchema)



