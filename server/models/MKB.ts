import mongoose from 'mongoose'

const { Schema, model, models } = mongoose as any

const MKBSchema = new Schema({
  category: { type: Schema.Types.ObjectId, ref: 'MKBCategory', required: true },
  stationCode: { type: String, required: true },
  mkbCode: { type: String, required: true },
  name: { type: String, required: true },
  note: { type: String }
}, { timestamps: true })

MKBSchema.index({ name: 'text', note: 'text' })
export default models.MKB || model('MKB', MKBSchema)
