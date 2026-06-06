import { dutyTitleToRole, resolveDutyTitle } from '../constants'

/** Пустой интервал отпуска. */
export function emptyVacation() {
  return { start: '', end: '' }
}

/** Пустой профиль предпочтений. */
export function emptyPreferences() {
  return { canWork: '', avoid: '' }
}

/**
 * Нормализует запись сотрудника с API: дополняет поля и вычисляет role для графика.
 * @param {object} raw — ответ /duty/employees
 */
export function normalizeEmployee(raw) {
  const vacations = Array.isArray(raw.vacations) ? raw.vacations : []
  const title = resolveDutyTitle(raw)
  const role = dutyTitleToRole(title)
  return {
    id: raw.id,
    name: String(raw.name || '').trim(),
    title,
    role,
    gender: raw.gender === 'M' || raw.gender === 'F' ? raw.gender : '',
    vacations: [
      vacations[0] ? { start: vacations[0].start || '', end: vacations[0].end || '' } : emptyVacation(),
      vacations[1] ? { start: vacations[1].start || '', end: vacations[1].end || '' } : emptyVacation(),
    ],
    preferences: {
      canWork: raw.preferences?.canWork || '',
      avoid: raw.preferences?.avoid || '',
    },
  }
}
