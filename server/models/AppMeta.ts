import mongoose, { Schema, Document } from 'mongoose'

export interface IAppMeta extends Document {
  key: string
  version?: string
  counter?: number
  lastCommit?: string
  updatedAt: Date
  createdAt: Date
}

const AppMetaSchema = new Schema<IAppMeta>({
  key: { type: String, required: true, unique: true, index: true },
  version: { type: String, trim: true },
  counter: { type: Number, default: 0 },
  lastCommit: { type: String, trim: true }
}, { timestamps: true })

export default mongoose.models.AppMeta || mongoose.model<IAppMeta>('AppMeta', AppMetaSchema)


