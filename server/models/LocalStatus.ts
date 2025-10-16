import mongoose from 'mongoose'

const { Schema, model, models } = mongoose as any

const LocalStatusSchema = new Schema({
  category: { type: Schema.Types.ObjectId, ref: 'LocalStatusCategory', required: true },
  stationCode: { type: String, required: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  note: { type: String },
  description: { type: String },
  complaints: { type: String },
  anamnesis: { type: String },
  localis: { type: String }
}, { timestamps: true })

LocalStatusSchema.index({ name: 'text', description: 'text', localis: 'text', note: 'text' })
export default models.LocalStatus || model('LocalStatus', LocalStatusSchema)



