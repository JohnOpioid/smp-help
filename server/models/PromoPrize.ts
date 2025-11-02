import mongoose, { Schema, Document } from 'mongoose'

export interface IPromoPrize extends Document {
  eventId: mongoose.Types.ObjectId
  title: string
  description?: string
  imageUrl?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

const PromoPrizeSchema = new Schema<IPromoPrize>({
  eventId: { type: Schema.Types.ObjectId, ref: 'PromoEvent', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  order: { type: Number, default: 0 }
}, { timestamps: true })

export default mongoose.models.PromoPrize || mongoose.model<IPromoPrize>('PromoPrize', PromoPrizeSchema)

