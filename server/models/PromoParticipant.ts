import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IPromoParticipant extends Document {
  userId: Types.ObjectId
  eventId: Types.ObjectId
  participatedAt: Date
  createdAt: Date
  updatedAt: Date
}

const PromoParticipantSchema = new Schema<IPromoParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'PromoEvent', required: true, index: true },
  participatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

PromoParticipantSchema.index({ userId: 1, eventId: 1 }, { unique: true })

export default mongoose.models.PromoParticipant || mongoose.model<IPromoParticipant>('PromoParticipant', PromoParticipantSchema)

