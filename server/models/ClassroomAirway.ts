import mongoose from 'mongoose'
const { Schema, model, models } = mongoose as any

const GraphSchema = new Schema({
  nodes: { type: [Schema.Types.Mixed], default: [] },
  edges: { type: [Schema.Types.Mixed], default: [] },
  viewport: { type: Schema.Types.Mixed, default: { x: 0, y: 0, zoom: 1 } }
}, { _id: false })

const ClassroomAirwaySchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  data: { type: Schema.Types.Mixed, default: {} },
  order: { type: Number, default: 0 }
}, { timestamps: true })

export default models.ClassroomAirway || model('ClassroomAirway', ClassroomAirwaySchema)


