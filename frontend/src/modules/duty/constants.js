/** Метка смены: бригада. */
export const DUTY_MARK_BRIGADE = 'Б'

/** Право на общий график дежурств (синхронно с backend). */
export const PERM_DUTY_VIEW = 'duty:view'

/** Метка смены: телефоны. */
export const DUTY_MARK_PHONE = 'О'

/** Цикл переключения ячейки при клике. */
export const DUTY_MARK_CYCLE = ['', DUTY_MARK_BRIGADE, DUTY_MARK_PHONE]

/** Черновик графика: видны прочерки в дни, когда сотрудник не может работать. */
export const SCHEDULE_VIEW_DRAFT = 'draft'

/** Чистовой график: только назначенные смены, без прочерков. */
export const SCHEDULE_VIEW_CLEAN = 'clean'

/** Прочерк в ячейке «нельзя ставить смену». */
export const DUTY_MARK_BLOCKED = '—'

/** Четыре должности в графике ОСМП (медсестра, медбрат и фельдшер — одна логика смен). */
export const DUTY_TITLES = [
  { value: 'doctor', label: 'Врач' },
  { value: 'nurse', label: 'Медсестра' },
  { value: 'medbrother', label: 'Медбрат' },
  { value: 'paramedic', label: 'Фельдшер' },
]

/**
 * Пояснение: средний медперсонал в графике одинаков, врачи — отдельный блок.
 */
export const DUTY_ROLE_STAFF_HINT =
  'Медсестра, медбрат и фельдшер в графике работают одинаково — отличается только название. Врачи выделены отдельным блоком.'

const DUTY_TITLE_LABELS = Object.fromEntries(DUTY_TITLES.map((t) => [t.value, t.label]))

/**
 * Подпись должности по значению title.
 * @param {'doctor'|'nurse'|'medbrother'|'paramedic'|''} title
 */
export function getDutyTitleLabel(title) {
  return DUTY_TITLE_LABELS[title] || '—'
}

/**
 * Роль для логики графика (разделитель врачей): doctor или средний персонал.
 * @param {'doctor'|'nurse'|'medbrother'|'paramedic'} title
 * @returns {'doctor'|'nurse'|'paramedic'}
 */
export function dutyTitleToRole(title) {
  if (title === 'doctor') return 'doctor'
  if (title === 'paramedic') return 'paramedic'
  return 'nurse'
}

/**
 * Восстанавливает title из старых полей role и gender.
 */
export function resolveDutyTitle(raw) {
  if (DUTY_TITLE_LABELS[raw.title]) return raw.title
  if (raw.role === 'doctor') return 'doctor'
  if (raw.role === 'paramedic') return 'paramedic'
  if (raw.role === 'nurse' && raw.gender === 'M') return 'medbrother'
  return 'nurse'
}

/** @deprecated Используйте getDutyTitleLabel(title). */
export function getDutyRoleLabel(role, gender = '') {
  return getDutyTitleLabel(resolveDutyTitle({ role, gender }))
}

/**
 * Сотрудники ОСМП в порядке строк бумажного графика.
 * Первые пять — врачи, далее медсестры, Зеленкин — фельдшер (строка 7).
 */
export const DUTY_EMPLOYEES = [
  { id: 1, name: 'Васильева Е.С.', role: 'doctor', title: 'doctor' },
  { id: 2, name: 'Дивинский Н.В.', role: 'doctor', title: 'doctor' },
  { id: 3, name: 'Корнева Т.И.', role: 'doctor', title: 'doctor' },
  { id: 4, name: 'Красницкий Я.И.', role: 'doctor', title: 'doctor' },
  { id: 5, name: 'Яшин В.А.', role: 'doctor', title: 'doctor' },
  { id: 6, name: 'Белялов С.В.', role: 'nurse', title: 'medbrother' },
  { id: 7, name: 'Зеленкин С.Е.', role: 'paramedic', title: 'paramedic' },
  { id: 8, name: 'Иванова Е.С.', role: 'nurse', title: 'nurse' },
  { id: 9, name: 'Кочулаева Н.Е.', role: 'nurse', title: 'nurse' },
  { id: 10, name: 'Левина Л.Г.', role: 'nurse', title: 'nurse' },
  { id: 11, name: 'Суркова С.А.', role: 'nurse', title: 'nurse' },
  { id: 12, name: 'Силин А.Ю.', role: 'nurse', title: 'medbrother' },
  { id: 13, name: 'Толпинская Г.А.', role: 'nurse', title: 'nurse' },
  { id: 14, name: 'Фомина Н.П.', role: 'nurse', title: 'nurse' },
]
