import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IPromoProgress extends Document {
  userId: Types.ObjectId
  eventId: Types.ObjectId
  count: number
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PromoProgressSchema = new Schema<IPromoProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'PromoEvent', required: true, index: true },
  count: { type: Number, default: 0, min: 0 },
  completedAt: { type: Date }
}, { timestamps: true })

PromoProgressSchema.index({ userId: 1, eventId: 1 }, { unique: true })

export default mongoose.models.PromoProgress || mongoose.model<IPromoProgress>('PromoProgress', PromoProgressSchema)


