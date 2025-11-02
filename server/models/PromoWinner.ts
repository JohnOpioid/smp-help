import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IPromoWinner extends Document {
  userId: Types.ObjectId
  eventId: Types.ObjectId
  prizeId: Types.ObjectId
  drawnAt: Date
  createdAt: Date
  updatedAt: Date
}

const PromoWinnerSchema = new Schema<IPromoWinner>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'PromoEvent', required: true, index: true },
  prizeId: { type: Schema.Types.ObjectId, ref: 'PromoPrize', required: true, index: true },
  drawnAt: { type: Date, default: Date.now }
}, { timestamps: true })

PromoWinnerSchema.index({ eventId: 1 })
PromoWinnerSchema.index({ userId: 1, eventId: 1 })

export default mongoose.models.PromoWinner || mongoose.model<IPromoWinner>('PromoWinner', PromoWinnerSchema)


