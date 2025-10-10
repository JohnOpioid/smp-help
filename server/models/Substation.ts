import mongoose from 'mongoose'
const { Schema, model, models } = mongoose as any

const LocationSchema = new Schema({
  type: { type: String, enum: ['Point'], required: true, default: 'Point' },
  coordinates: { type: [Number], required: true } // [lng, lat]
}, { _id: false })

const SubstationSchema = new Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  phones: { type: [String], default: [] },
  location: { type: LocationSchema, required: true },
  region: { type: Schema.Types.ObjectId, ref: 'Region' },
}, { timestamps: true })

SubstationSchema.index({ location: '2dsphere' })

const Substation = models.Substation || model('Substation', SubstationSchema)
export default Substation


