import mongoose from 'mongoose'

const { Schema, model, models, Types } = mongoose as any

const AnswerSchema = new Schema({
  text: { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, default: false }
}, { _id: false })

const TestSchema = new Schema({
  category: { type: Types.ObjectId, ref: 'TestCategory', required: true, index: true },
  question: { type: String, required: true, trim: true },
  answers: { type: [AnswerSchema], default: [] },
  explanation: { type: String },
  markdown: { type: String },
  order: { type: Number, default: 0 }
}, { timestamps: true })

export default models.Test || model('Test', TestSchema)



