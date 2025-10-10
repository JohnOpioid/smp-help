import mongoose, { Schema, Document } from 'mongoose'

export interface IAlgorithmCategory extends Document {
  sections: mongoose.Types.ObjectId[]
  name: string
  url: string
  createdAt: Date
  updatedAt: Date
}

const AlgorithmCategorySchema = new Schema<IAlgorithmCategory>({
  sections: [{ type: Schema.Types.ObjectId, ref: 'AlgorithmSection', required: true }],
  name: { type: String, required: true, trim: true },
  url: { type: String, required: false, trim: true, index: true }
}, { timestamps: true })

export default mongoose.models.AlgorithmCategory || mongoose.model<IAlgorithmCategory>('AlgorithmCategory', AlgorithmCategorySchema)


