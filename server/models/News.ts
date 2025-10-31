import mongoose, { Schema, Document } from 'mongoose'

export interface INews extends Document {
  title: string
  description?: string
  date?: Date
  icon?: string
  // link removed
  published: boolean
  createdAt: Date
  updatedAt: Date
}

const NewsSchema = new Schema<INews>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  date: { type: Date },
  icon: { type: String, trim: true, default: 'i-lucide-newspaper' },
  published: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.models.News || mongoose.model<INews>('News', NewsSchema)


