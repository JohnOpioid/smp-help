import mongoose from 'mongoose'
const { Schema, model, models } = mongoose as any

const RegionPhoneSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true })

const RegionPhone = models.RegionPhone || model('RegionPhone', RegionPhoneSchema)
export default RegionPhone
