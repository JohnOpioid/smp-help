import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Classroom from '~/server/models/Classroom'

// Черновая миграция: добавляет начальные графы для раздела airway (дети/взрослые)
export default defineEventHandler(async () => {
  await connectDB()

  const box = (title: string, body: string, tone: 'neutral'|'blue'|'pink', x: number, y: number) => ({
    id: 'n_' + Math.random().toString(36).slice(2, 9),
    type: 'block',
    position: { x, y },
    data: { title, bodyMd: body, tone }
  })

  const edge = (source: string, target: string) => ({ id: 'e_' + source + '_' + target, source, target })

  // ВЗРОСЛЫЕ
  const adultsNodes: any[] = []
  const adultsEdges: any[] = []

  const a_responsible = box('Ответственный сотрудник бригады', '• 100 % кислород\n• Масочная ВВЛ\n• Пульсоксиметрия', 'blue', 40, 40)
  const a_preox = box('1 минута преоксигенации\nFiO₂ 1.0', '', 'neutral', 40, 160)
  const a_brady = box('Контроль брадикардии:', '< 60 в минуту', 'neutral', 40, 260)
  const a_diag = box('Диагностика', '• Нестабильность шейного отдела позвоночника\n• Перелом челюстей\n• Неудобное положение пациента', 'blue', 40, 360)
  const a_sg = box('Установка надгортанного герметизирующего устройства', '', 'neutral', 40, 520)
  const a_ipv = box('ИВЛ/ВВЛ', '', 'neutral', 40, 620)

  const a_helper = box('Помощник ответственного сотрудника бригады', '• Катетеризация вены\n• Начало стабилизации гемодинамики\n• Подготовить капнограф (при наличии)', 'blue', 520, 40)
  const a_atropine = box('Атропин 0,5–1 мг (0,5–1 мл)\nв разведении в/венно струйно', '', 'pink', 520, 120)
  const a_gcs = box('При коме > 4 баллов по шкале комы Глазго', '– Мидазолам 5 мг (1 мл) в/венно (для бригад АиР)\n– и Кетамин 1–2 мг/кг (0,02–0,04 мл/кг) в/венно\nили Диазепам 10 мг (2 мл) в/венно\nи Кетамин 1–2 мг/кг (0,02–0,04 мл) в/венно\nили Мидазолам 5 мг (1 мл) в/венно (для бригад АиР)\nи Фентанил 0,05–0,1 мг (1–2 мл) в/венно\nили Диазепам 10–20 мг (2–4 мл) в/венно\nи Фентанил 0,05–0,1 мг (1–2 мл) в/венно\nили Пропофол 1,5–2 мг/кг (0,15–0,2 мл/кг) в/венно (для бригад АиР)', 'pink', 520, 220)
  const a_sux = box('Суксаметония хлорид 1–1,5 мг/кг (0,05–0,075 мл) в/венно\n+ Приём Селлика (до раздувания манжеты)', 'pink', 520, 420)
  const a_laryngoscopy = box('Проведение прямой ларингоскопии', '', 'blue', 820, 420)
  const a_visualization = box('Визуализация голосовой щели\nили черпаловидных хрящей', '', 'blue', 300, 520)
  const a_intub = box('Интубация трахеи', '', 'neutral', 520, 620)
  const a_difficult = box('Протокол «трудной» интубации', '', 'blue', 820, 620)

  adultsNodes.push(
    a_responsible, a_preox, a_brady, a_diag, a_sg, a_ipv,
    a_helper, a_atropine, a_gcs, a_sux, a_laryngoscopy, a_visualization, a_intub, a_difficult
  )

  adultsEdges.push(
    edge(a_responsible.id, a_preox.id),
    edge(a_preox.id, a_brady.id),
    edge(a_brady.id, a_diag.id),
    edge(a_diag.id, a_sg.id),
    edge(a_sg.id, a_ipv.id),
    edge(a_helper.id, a_atropine.id),
    edge(a_atropine.id, a_gcs.id),
    edge(a_gcs.id, a_sux.id),
    edge(a_sux.id, a_laryngoscopy.id),
    edge(a_visualization.id, a_intub.id)
  )

  // ДЕТИ
  const ch_responsible = box('Ответственный сотрудник бригады', '• 100 % кислород\n• Масочная ВВЛ\n• Пульсоксиметрия', 'blue', 40, 40)
  const ch_preox = box('1 минута преоксигенации\nFiO₂ 1.0', '', 'neutral', 40, 160)
  const ch_brady = box('Контроль брадикардии:', '< 30 % от возрастной нормы', 'neutral', 40, 260)
  const ch_diag = box('Диагностика', '• Нестабильность шейного отдела позвоночника\n• Перелом челюстей\n• Неудобное положение пациента', 'blue', 40, 360)
  const ch_sg = box('Установка надгортанного герметизирующего устройства', '', 'neutral', 40, 520)
  const ch_ipv = box('ИВЛ/ВВЛ', '', 'neutral', 40, 620)

  const ch_helper = box('Помощник ответственного сотрудника бригады', '• Катетеризация вены\n• Начало стабилизации гемодинамики\n• Подготовить капнограф (при наличии)', 'blue', 520, 40)
  const ch_atropine = box('Атропин 0,01 мг/кг (0,01 мл/кг)\nв разведении в/венно струйно', '', 'pink', 520, 120)
  const ch_sed = box('При коме > 4 баллов по шкале комы ГЛАЗГО', '– Мидазолам 0,2–0,3 мг/кг (0,1–0,15 мл/кг) в/венно (для бригад АиР)\nи Кетамин 1–2 мг/кг (0,02–0,04 мл/кг) в/венно\nили Диазепам 0,2–0,5 мг/кг (0,04–0,1 мл/кг) в/венно\nи Кетамин 1–2 мг/кг (0,02–0,04 мл/кг) в/венно\nили Мидазолам 0,3–0,5 мг/кг (0,1–0,15 мл/кг) в/венно (для бригад АиР)\nи Фентанил 1–4 мкг/кг (0,02–0,08 мл/кг) в/венно\nили Диазепам 0,2–0,5 мг/кг (0,04–0,1 мл/кг) в/венно\nи Фентанил 1–4 мкг/кг (0,02–0,08 мл/кг) в/венно\nили Пропофол 2–4 мг/кг (0,2–0,4 мл/кг) в/венно (для бригад АиР)', 'pink', 520, 220)
  const ch_sux = box('Суксаметония хлорид 1–2 мг/кг (0,05–0,1 мл/кг)\nв/венно (с 1 года)', 'pink', 520, 420)
  const ch_laryngoscopy = box('Проведение прямой ларингоскопии', '', 'blue', 820, 420)
  const ch_visualization = box('Визуализация голосовой щели\nили черпаловидных хрящей', '', 'blue', 300, 520)
  const ch_intub = box('Интубация трахеи', '', 'neutral', 520, 620)
  const ch_difficult = box('Протокол «трудной» интубации', '', 'blue', 820, 620)

  const childrenNodes = [
    ch_responsible, ch_preox, ch_brady, ch_diag, ch_sg, ch_ipv,
    ch_helper, ch_atropine, ch_sed, ch_sux, ch_laryngoscopy, ch_visualization, ch_intub, ch_difficult
  ]
  const childrenEdges = [
    edge(ch_responsible.id, ch_preox.id),
    edge(ch_preox.id, ch_brady.id),
    edge(ch_brady.id, ch_diag.id),
    edge(ch_diag.id, ch_sg.id),
    edge(ch_sg.id, ch_ipv.id),
    edge(ch_helper.id, ch_atropine.id),
    edge(ch_atropine.id, ch_sed.id),
    edge(ch_sed.id, ch_sux.id),
    edge(ch_sux.id, ch_laryngoscopy.id),
    edge(ch_visualization.id, ch_intub.id)
  ]

  const data = {
    children: { nodes: childrenNodes, edges: childrenEdges, viewport: { x: 0, y: 0, zoom: 0.9 } },
    adults: { nodes: adultsNodes, edges: adultsEdges, viewport: { x: 0, y: 0, zoom: 0.9 } }
  }

  const doc = await Classroom.findOneAndUpdate(
    { section: 'airway' },
    { $set: { title: 'Проходимость дыхательных путей', data } },
    { upsert: true, new: true }
  ).lean()

  return { success: true, item: doc }
})


