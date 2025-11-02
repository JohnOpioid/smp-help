import mongoose, { Schema, Document } from 'mongoose'

export interface IPromoEvent extends Document {
  title: string
  slug: string
  description?: string
  startAt: Date
  endAt: Date
  drawAt?: Date
  requiredCount: number
  spriteIcon: string // UIcon код, например i-lucide-ghost
  themeLogo?: string // UIcon/класс или вариант логотипа
  themeColor?: string // основной цвет темы, например orange
  themeBgColor?: string // цвет фона, tailwind цвет
  themePrimaryColor?: string // основной акцент
  themeSecondaryColor?: string // второстепенный акцент
  themeTextPrimaryColor?: string // основной цвет текста
  themeTextSecondaryColor?: string // второстепенный цвет текста
  panelOpacity?: number // прозрачность «мягких» панелей (в процентах, 0-100)
  spawnChance?: number // шанс спауна спрайта на странице (в процентах, 0-100)
  bgImageUrl?: string // фоновое изображение лендинга (URL)
  eventLogoUrl?: string // логотип мероприятия (URL)
  published: boolean
  isRecurring?: boolean // повторяющийся ивент (каждый год в те же даты)
  createdAt: Date
  updatedAt: Date
}

const PromoEventSchema = new Schema<IPromoEvent>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  drawAt: { type: Date },
  requiredCount: { type: Number, default: 5, min: 1 },
  spriteIcon: { type: String, required: true, trim: true },
  themeLogo: { type: String, trim: true },
  themeColor: { type: String, trim: true },
  themeBgColor: { type: String, trim: true },
  themePrimaryColor: { type: String, trim: true },
  themeSecondaryColor: { type: String, trim: true },
  themeTextPrimaryColor: { type: String, trim: true },
  themeTextSecondaryColor: { type: String, trim: true },
  panelOpacity: { type: Number, default: 8, min: 0, max: 100 },
  spawnChance: { type: Number, default: 100, min: 0, max: 100 },
  bgImageUrl: { type: String, trim: true },
  eventLogoUrl: { type: String, trim: true },
  published: { type: Boolean, default: true },
  isRecurring: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.models.PromoEvent || mongoose.model<IPromoEvent>('PromoEvent', PromoEventSchema)


