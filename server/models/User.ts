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
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  telegram?: {
    id: string
    username?: string
    photo_url?: string
    auth_date?: Date
  }
  avatarUrl?: string
  lastTelegramAuth?: Date
  bookmarks?: Array<{
    _id: string
    type: 'drug' | 'local-status' | 'codifier' | 'substation' | 'calculator'
    title: string
    description?: string
    category?: string
    url?: string
    mkbCode?: string
    stationCode?: string
    code?: string
    complaints?: string
    anamnesis?: string
    localis?: string
    // Дополнительные поля для препаратов
    indications?: string[]
    contraindications?: string[]
    dosages?: string[]
    sideEffects?: string[]
    adverse?: string[] // побочные (альтернативное название)
    mechanismOfAction?: string[]
    mechanism?: string[] // альтернативное название
    pharmacokinetics?: any
    latinName?: string
    categories?: string[]
    synonyms?: string[]
    analogs?: string[]
    interactions?: string[]
    antidotes?: string[]
    antidote?: any
    description?: string
    forms?: any
    pediatricDose?: string[]
    pediatricDoseUnit?: string
    ageRestrictions?: string
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
    required: true
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
  resetPasswordToken: {
    type: String,
    required: false
  },
  resetPasswordExpires: {
    type: Date,
    required: false
  },
  telegram: {
    type: {
      id: String,
      username: String,
      photo_url: String,
      auth_date: Date
    },
    required: false,
    _id: false
  },
  lastTelegramAuth: {
    type: Date,
    required: false
  },
  avatarUrl: {
    type: String,
    required: false,
    default: ''
  },
  bookmarks: {
    type: [
      new Schema({
        type: { type: String, enum: ['drug', 'local-status', 'codifier', 'substation', 'calculator'], required: true },
        title: { type: String, required: true },
        description: { type: String, required: false },
        category: { type: String, required: false },
        url: { type: String, required: false },
        mkbCode: { type: String, required: false },
        stationCode: { type: String, required: false },
        code: { type: String, required: false },
        complaints: { type: String, required: false },
        anamnesis: { type: String, required: false },
        localis: { type: String, required: false },
        // Дополнительные поля для препаратов
        indications: { type: [String], required: false },
        contraindications: { type: [String], required: false },
        dosages: { type: [String], required: false },
        sideEffects: { type: [String], required: false },
        adverse: { type: [String], required: false }, // побочные (альтернативное название)
        mechanismOfAction: { type: [String], required: false },
        mechanism: { type: [String], required: false }, // альтернативное название
        pharmacokinetics: { type: Object, required: false },
        latinName: { type: String, required: false },
        categories: { type: [String], required: false },
        synonyms: { type: [String], required: false },
        analogs: { type: [String], required: false },
        interactions: { type: [String], required: false },
        antidotes: { type: [String], required: false },
        antidote: { type: Object, required: false },
        forms: { type: Object, required: false },
        pediatricDose: { type: [String], required: false },
        pediatricDoseUnit: { type: String, required: false },
        ageRestrictions: { type: String, required: false },
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
