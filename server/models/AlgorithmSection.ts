import mongoose from 'mongoose'

const AlgorithmSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Индексы для поиска
AlgorithmSectionSchema.index({ name: 'text', description: 'text' })

export default mongoose.models.AlgorithmSection || mongoose.model('AlgorithmSection', AlgorithmSectionSchema)
