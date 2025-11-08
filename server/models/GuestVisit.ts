import mongoose, { Schema, Document } from 'mongoose'

export interface IGuestVisit extends Document {
  ip: string
  userAgent?: string
  date: Date
  createdAt: Date
}

const GuestVisitSchema = new Schema<IGuestVisit>({
  ip: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
})

// Индекс для быстрого поиска по дате
GuestVisitSchema.index({ date: 1 })

export default mongoose.models.GuestVisit || mongoose.model<IGuestVisit>('GuestVisit', GuestVisitSchema)

