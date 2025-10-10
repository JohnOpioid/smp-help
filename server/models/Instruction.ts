import mongoose from 'mongoose'

const InstructionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

export default mongoose.models.Instruction || mongoose.model('Instruction', InstructionSchema)


