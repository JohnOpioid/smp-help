import mongoose from 'mongoose'

const { Schema, model, models } = mongoose as any

const SettingSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed }
}, { timestamps: true })

export default models.Setting || model('Setting', SettingSchema)


