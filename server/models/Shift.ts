import mongoose, { Schema, Document } from 'mongoose'

export interface IShift extends Document {
  userId: string
  date: Date
  title: string
  startTime?: string
  endTime?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}

const ShiftSchema = new Schema<IShift>({
  userId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  title: { type: String, required: true },
  startTime: { type: String },
  endTime: { type: String },
  color: { type: String }
}, {
  timestamps: true
})

export default mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema)


