import mongoose, { Schema, Document } from 'mongoose'

export interface IAlternationDay {
  templateId?: string
  free?: boolean
}

export interface IShiftAlternation extends Document {
  userId: string
  title?: string
  days: IAlternationDay[] // ожидаем 14 элементов
  createdAt: Date
  updatedAt: Date
}

const AlternationDaySchema = new Schema<IAlternationDay>({
  templateId: { type: String },
  free: { type: Boolean }
}, { _id: false })

const ShiftAlternationSchema = new Schema<IShiftAlternation>({
  userId: { type: String, required: true, index: true },
  title: { type: String },
  days: { type: [AlternationDaySchema], required: true, default: [] }
}, { timestamps: true })

export default mongoose.models.ShiftAlternation || mongoose.model<IShiftAlternation>('ShiftAlternation', ShiftAlternationSchema)


