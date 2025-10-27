import mongoose, { Schema, Document } from 'mongoose'

export interface ICalculator extends Document {
  name: string
  description: string
  url: string
  category: string
  keywords?: string[]
  createdAt: Date
  updatedAt: Date
}

const CalculatorSchema = new Schema<ICalculator>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: false, trim: true },
  url: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  keywords: [{ type: String, trim: true }]
}, { timestamps: true })

export default mongoose.models.Calculator || mongoose.model<ICalculator>('Calculator', CalculatorSchema)

