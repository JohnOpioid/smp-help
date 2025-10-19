import mongoose, { Schema, Document } from 'mongoose'

export interface IAlgorithm extends Document {
  category: mongoose.Types.ObjectId // ref to AlgorithmCategory
  section: mongoose.Types.ObjectId // ref to AlgorithmSection
  title: string
  order?: number
  mkbCodes: string[] // основные коды МКБ
  mkbExclusions: string[] // исключения (коды "кроме")
  content: string // markdown/html
  createdAt: Date
  updatedAt: Date
}

const AlgorithmSchema = new Schema<IAlgorithm>({
  category: { type: Schema.Types.ObjectId, ref: 'AlgorithmCategory', required: true, index: true },
  section: { type: Schema.Types.ObjectId, ref: 'AlgorithmSection', required: true },
  title: { type: String, required: true, trim: true },
  order: { type: Number, default: null },
  mkbCodes: [{ type: String, trim: true }], // основные коды МКБ
  mkbExclusions: [{ type: String, trim: true }], // исключения (коды "кроме")
  content: { type: String }
}, { timestamps: true })

export default mongoose.models.Algorithm || mongoose.model<IAlgorithm>('Algorithm', AlgorithmSchema)


