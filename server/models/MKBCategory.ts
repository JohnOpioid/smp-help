import mongoose from 'mongoose'
import { slugifyForUrl } from '~/server/utils/textNormalization'

const { Schema, model, models } = mongoose

const MKBCategorySchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 1 },
  url: { type: String, required: true, unique: true },
  // Код класса из mkb.json ("cl1", "cl2", ...)
  class: { type: String, required: true, unique: true, trim: true }
}, { timestamps: true })

MKBCategorySchema.pre('validate', function (next) {
  // @ts-ignore
  if ((!this.url || this.isModified('name')) && this.name) {
    // @ts-ignore
    this.url = slugifyForUrl(this.name)
  }
  next()
})

export default models.MKBCategory || model('MKBCategory', MKBCategorySchema)


