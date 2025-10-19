import mongoose from 'mongoose'
import { slugifyForUrl } from '~/server/utils/textNormalization'

const { Schema, model, models } = mongoose

const DrugCategorySchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 1 },
  url: { type: String, required: true, unique: true }
}, { timestamps: true })

DrugCategorySchema.pre('save', function (next) {
  // @ts-ignore
  if (this.isModified('name') && this.name) {
    // @ts-ignore
    this.url = slugifyForUrl(this.name)
  }
  next()
})

export default models.DrugCategory || model('DrugCategory', DrugCategorySchema)


