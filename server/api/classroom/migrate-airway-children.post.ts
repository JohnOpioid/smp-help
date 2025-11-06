import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Classroom from '~/server/models/Classroom'

export default defineEventHandler(async () => {
  await connectDB()

  const box = (title: string, body: string, tone: 'neutral'|'blue'|'pink'|'green', x: number, y: number) => ({
    id: 'n_' + Math.random().toString(36).slice(2, 9),
    type: 'block',
    position: { x, y },
    data: { title, bodyMd: body, tone }
  })

  const edge = (source: string, target: string, label?: string) => ({ 
    id: 'e_' + source + '_' + target, 
    source, 
    target,
    label: label || ''
  })

  // Узлы для схемы "Дети"
  const ch_responsible = box(
    'Ответственный сотрудник бригады',
    '• 100% кислород\n• Масочная ВВЛ\n• Пульсоксиметрия',
    'blue',
    40,
    40
  )

  const ch_preox = box(
    '1 минута преоксигенации FiO₂ 1.0',
    '',
    'neutral',
    40,
    160
  )

  const ch_brady = box(
    'Контроль брадикардии:',
    '< 30% от возрастной нормы',
    'neutral',
    40,
    260
  )

  const ch_atropine = box(
    'Атропин 0,01 мг/кг (0,01 мл/кг)',
    'в разведении в/венно струйно',
    'neutral',
    520,
    160
  )

  const ch_diag = box(
    'Диагностика',
    '• Нестабильность шейного отдела позвоночника\n• Перелом челюстей\n• Неудобное положение пациента',
    'blue',
    40,
    360
  )

  const ch_sg = box(
    'Установка надгортанного герметизирующего устройства',
    '',
    'neutral',
    40,
    480
  )

  const ch_ipv = box(
    'ИВЛ/ВВЛ',
    '',
    'neutral',
    40,
    600
  )

  const ch_visualization = box(
    'Визуализация голосовой щели или черпаловидных хрящей',
    '',
    'neutral',
    40,
    720
  )

  const ch_intub = box(
    'Интубация трахеи',
    '',
    'neutral',
    40,
    840
  )

  const ch_difficult = box(
    'Протокол «трудной» интубации',
    '',
    'neutral',
    40,
    960
  )

  const ch_laryngoscopy = box(
    'Проведение прямой ларингоскопии',
    '',
    'neutral',
    40,
    1080
  )

  const ch_helper = box(
    'Помощник ответственного сотрудника бригады',
    '• Катетеризация вены\n• Начало стабилизации гемодинамики\n• Подготовить капнограф (при наличии)',
    'blue',
    520,
    40
  )

  // Блок с условием комы
  const ch_coma = box(
    'При коме > 4 баллов по шкале комы ГЛАЗГО:',
    '',
    'neutral',
    520,
    260
  )

  // Блоки с лекарствами (при коме > 4 баллов по шкале Глазго)
  const ch_sed_midazolam_ketamine = box(
    'Мидазолам 0,2-0,3 мг/кг (0,1-0,15 мл/кг) в/венно (для бригад АиР)',
    'и Кетамин 1-2 мг/кг (0,02-0,04 мл/кг) в/венно',
    'green',
    520,
    340
  )

  const ch_sed_diazepam_ketamine = box(
    'Диазепам 0,2-0,5 мг/кг (0,04-0,1 мл/кг) в/венно',
    'и Кетамин 1-2 мг/кг (0,02-0,04 мл/кг) в/венно',
    'green',
    520,
    440
  )

  const ch_sed_midazolam_fentanyl = box(
    'Мидазолам 0,2-0,3 мг/кг (0,1-0,15 мл/кг) в/венно (для бригад АиР)',
    'и Фентанил 1-4 мкг/кг (0,02-0,08 мл/кг) в/венно',
    'green',
    520,
    540
  )

  const ch_sed_diazepam_fentanyl = box(
    'Диазепам 0,2-0,5 мг/кг (0,04-0,1 мл/кг) в/венно',
    'и Фентанил 1-4 мкг/кг (0,02-0,08 мл/кг) в/венно',
    'green',
    520,
    640
  )

  const ch_sed_propofol = box(
    'Пропофол 2-4 мг/кг (0,2-0,4 мл/кг) в/венно (для бригад АиР)',
    '',
    'green',
    520,
    740
  )

  const ch_sux = box(
    'Суксаметония хлорид 1-2 мг/кг (0,05-0,1 мл/кг) в/венно (с 1 года) (для бригад АиР)',
    '',
    'green',
    520,
    800
  )

  const childrenNodes = [
    ch_responsible,
    ch_preox,
    ch_brady,
    ch_atropine,
    ch_diag,
    ch_sg,
    ch_ipv,
    ch_visualization,
    ch_intub,
    ch_difficult,
    ch_laryngoscopy,
    ch_helper,
    ch_coma,
    ch_sed_midazolam_ketamine,
    ch_sed_diazepam_ketamine,
    ch_sed_midazolam_fentanyl,
    ch_sed_diazepam_fentanyl,
    ch_sed_propofol,
    ch_sux
  ]

  // Связи между узлами
  const childrenEdges = [
    // Основной поток ответственного сотрудника
    edge(ch_responsible.id, ch_preox.id),
    edge(ch_preox.id, ch_brady.id),
    edge(ch_brady.id, ch_diag.id, 'Нет'),
    edge(ch_brady.id, ch_atropine.id, 'Есть'),
    edge(ch_atropine.id, ch_diag.id),
    
    // Параллельный поток помощника
    edge(ch_helper.id, ch_atropine.id),
    
    // Поток диагностики
    edge(ch_diag.id, ch_sg.id, 'Есть'),
    edge(ch_diag.id, ch_visualization.id, 'Нет'),
    
    // Поток надгортанного устройства
    edge(ch_sg.id, ch_ipv.id, 'Успешно'),
    edge(ch_sg.id, ch_visualization.id, 'Нет'),
    
    // Поток визуализации
    edge(ch_visualization.id, ch_intub.id, 'Есть'),
    edge(ch_visualization.id, ch_laryngoscopy.id, 'Нет'),
    
    // Поток интубации
    edge(ch_intub.id, ch_ipv.id, 'Успешно'),
    edge(ch_intub.id, ch_difficult.id, 'Не успешно'),
    
    // Поток ларингоскопии
    edge(ch_laryngoscopy.id, ch_difficult.id),
    
    // Поток лекарств (от диагностики и брадикардии через блок комы)
    edge(ch_diag.id, ch_coma.id, 'Нет'),
    edge(ch_brady.id, ch_coma.id, 'Нет'),
    
    // От блока комы к вариантам седации
    edge(ch_coma.id, ch_sed_midazolam_ketamine.id),
    edge(ch_coma.id, ch_sed_diazepam_ketamine.id),
    edge(ch_coma.id, ch_sed_midazolam_fentanyl.id),
    edge(ch_coma.id, ch_sed_diazepam_fentanyl.id),
    edge(ch_coma.id, ch_sed_propofol.id),
    
    // От седации к суксаметонии
    edge(ch_sed_midazolam_ketamine.id, ch_sux.id),
    edge(ch_sed_diazepam_ketamine.id, ch_sux.id),
    edge(ch_sed_midazolam_fentanyl.id, ch_sux.id),
    edge(ch_sed_diazepam_fentanyl.id, ch_sux.id),
    edge(ch_sed_propofol.id, ch_sux.id),
    
    // От суксаметонии к ларингоскопии
    edge(ch_sux.id, ch_laryngoscopy.id)
  ]

  // Получаем существующий документ
  const doc = await Classroom.findOne({ section: 'airway' })
  
  if (!doc) {
    return { success: false, message: 'Airway document not found. Please create it first.' }
  }

  // Обновляем только children данные
  const data: any = doc.data || {}
  data.children = {
    nodes: childrenNodes,
    edges: childrenEdges,
    viewport: { x: 0, y: 0, zoom: 0.8 }
  }

  doc.data = data
  doc.markModified('data')
  await doc.save()

  return { success: true, item: doc.toObject ? doc.toObject() : doc }
})

