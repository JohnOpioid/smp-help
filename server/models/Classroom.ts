import mongoose from 'mongoose'
const { Schema, model, models } = mongoose as any

const ClassroomSchema = new Schema({
  section: { type: String, required: true, unique: true }, // например: 'cpr', 'instructions'
  title: { type: String, default: '' },
  data: { type: Schema.Types.Mixed, default: {} }, // произвольный формат: { rows, notes } или { items }
  order: { type: Number, default: 0 }
}, { timestamps: true })

export default models.Classroom || model('Classroom', ClassroomSchema)


