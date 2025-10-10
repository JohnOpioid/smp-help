import mongoose, { Schema, Document } from 'mongoose'

export interface IShiftTemplate extends Document {
  userId: string
  title?: string
  startTime: string
  endTime?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}

const ShiftTemplateSchema = new Schema<IShiftTemplate>({
  userId: { type: String, required: true, index: true },
  title: { type: String },
  startTime: { type: String, required: true },
  endTime: { type: String },
  color: { type: String }
}, { timestamps: true })

export default mongoose.models.ShiftTemplate || mongoose.model<IShiftTemplate>('ShiftTemplate', ShiftTemplateSchema)


