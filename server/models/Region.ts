import mongoose from 'mongoose'
const { Schema, model, models } = mongoose as any

const RegionSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  manager: { type: String, trim: true },
  district: { type: String, trim: true },
  phones: [{ 
    name: { type: String, required: true, trim: true },
    number: { type: String, required: true, trim: true }
  }]
}, { timestamps: true })

const Region = models.Region || model('Region', RegionSchema)
export default Region
