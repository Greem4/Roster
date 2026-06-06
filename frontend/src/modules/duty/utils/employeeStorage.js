import { DUTY_EMPLOYEES } from '../constants'

/** Ключ localStorage для справочника сотрудников ОСМП. */
export const DUTY_EMPLOYEES_STORAGE_KEY = 'roster-duty-employees-v1'

/** Пустой интервал отпуска. */
export function emptyVacation() {
  return { start: '', end: '' }
}

/** Пустой профиль предпочтений. */
export function emptyPreferences() {
  return { canWork: '', avoid: '' }
}

/**
 * Нормализует запись сотрудника: дополняет отсутствующие поля значениями по умолчанию.
 * @param {object} raw — сырая запись из хранилища
 */
export function normalizeEmployee(raw) {
  const vacations = Array.isArray(raw.vacations) ? raw.vacations : []
  return {
    id: raw.id,
    name: String(raw.name || '').trim(),
    role: raw.role === 'doctor' || raw.role === 'nurse' || raw.role === 'paramedic'
      ? raw.role
      : 'nurse',
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

/** Начальный справочник из бумажного графика (без отпусков и предпочтений). */
export function seedEmployees() {
  return DUTY_EMPLOYEES.map(normalizeEmployee)
}

/**
 * Загружает сотрудников из localStorage или возвращает seed-данные.
 */
export function loadEmployees() {
  try {
    const raw = localStorage.getItem(DUTY_EMPLOYEES_STORAGE_KEY)
    if (!raw) return seedEmployees()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return seedEmployees()
    return parsed.map(normalizeEmployee)
  } catch {
    return seedEmployees()
  }
}

/** Сохраняет справочник сотрудников в localStorage. */
export function saveEmployees(employees) {
  localStorage.setItem(DUTY_EMPLOYEES_STORAGE_KEY, JSON.stringify(employees.map(normalizeEmployee)))
  window.dispatchEvent(new CustomEvent('duty-employees-changed'))
}

/** Следующий свободный id для нового сотрудника. */
export function nextEmployeeId(employees) {
  return employees.reduce((max, e) => Math.max(max, e.id), 0) + 1
}
