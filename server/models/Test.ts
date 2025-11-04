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
  order: { type: Number, default: 0 },
  approved: { type: Boolean, default: false, index: true },
  createdBy: { type: Types.ObjectId, ref: 'User', required: false },
  suggestion: {
    question: { type: String, trim: true },
    answers: { type: [AnswerSchema], default: [] },
    createdBy: { type: Types.ObjectId, ref: 'User' },
    createdAt: { type: Date }
  },
  correctedBy: { type: Types.ObjectId, ref: 'User', required: false },
  correctedAt: { type: Date, required: false }
}, { timestamps: true })

export default models.Test || model('Test', TestSchema)



