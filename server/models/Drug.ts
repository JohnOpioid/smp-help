import mongoose from 'mongoose'

const { Schema, model, models } = mongoose as any

const DoseSchema = new Schema({
  context: { type: String, trim: true }, // напр.: Взрослые / Дети / IV / IM
  formula: { type: String, trim: true }, // человекочитаемое правило, напр.: "0.1–0.3 мг/кг"
  mgPerKg: { type: Number },
  maxMg: { type: Number },
  concentrationMgPerMl: { type: Number },
  notes: { type: String, trim: true }
}, { _id: false })

const PharmacokineticsSchema = new Schema({
  onset: { type: String, trim: true },
  duration: { type: String, trim: true },
  half_life: { type: String, trim: true },
  metabolism: { type: String, trim: true },
  elimination: { type: String, trim: true }
}, { _id: false })

const DrugSchema = new Schema({
  categories: [{ type: Schema.Types.ObjectId, ref: 'DrugCategory' }],
  name: { type: String, required: true, trim: true },
  latinName: { type: String, trim: true },
  synonyms: [{ type: String, trim: true }],
  analogs: [{ type: String, trim: true }],
  groups: [{ type: String, trim: true }],
  mechanism: [{ type: String, trim: true }],
  forms: {
    doseValue: { type: Number }, // числовая дозировка (например, 1)
    doseUnit: { type: String, trim: true }, // единица (например, мг/мл, мкг/мл)
    volumeMl: { type: Number } // объем мл в ампуле/таблетке (число)
  },
  pediatricDose: [{ type: String, trim: true }], // массив дозировок в педиатрии (например, "20-30 мг/кг")
  pediatricDoseUnit: { type: String, trim: true }, // единица измерения педиатрической дозировки (например, "мг/кг")
  ageRestrictions: { type: String, trim: true }, // возрастные ограничения
  indications: [{ type: String, trim: true }],
  contraindications: [{ type: String, trim: true }],
  adverse: [{ type: String, trim: true }], // побочные
  interactions: [{ type: String, trim: true }],
  antidotes: [{ type: String, trim: true }],
  // Расширенные поля из YAML
  antidote: { type: Object },
  dosages: { type: Object },
  pharmacokinetics: { type: PharmacokineticsSchema },
  description: { type: String, trim: true }, // markdown
  doses: [DoseSchema],
}, { timestamps: true })

export default models.Drug || model('Drug', DrugSchema)


