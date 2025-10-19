import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  email: string
  password: string
  firstName: string
  lastName: string
  city?: string
  substation?: string
  role: 'admin' | 'user'
  bookmarks?: Array<{
    _id: string
    type: 'drug' | 'local-status' | 'codifier' | 'substation'
    title: string
    description?: string
    category?: string
    url?: string
    createdAt: Date
  }>
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  substation: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  bookmarks: {
    type: [
      new Schema({
        type: { type: String, enum: ['drug', 'local-status', 'codifier', 'substation'], required: true },
        title: { type: String, required: true },
        description: { type: String, required: false },
        category: { type: String, required: false },
        url: { type: String, required: false },
        createdAt: { type: Date, default: Date.now }
      }, { _id: true, id: true })
    ],
    default: []
  }
}, {
  timestamps: true
})

// Хеширование пароля перед сохранением
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Метод для сравнения паролей
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
