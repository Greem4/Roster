import { dutyTitleToRole, resolveDutyTitle } from '../constants'

/** Пустой интервал отпуска. */
export function emptyVacation() {
  return { start: '', end: '' }
}

/** Пустой профиль предпочтений. */
export function emptyPreferences() {
  return { canWork: '', avoid: '' }
}

/** Минимально допустимая дата рождения (год). */
export const DUTY_MIN_BIRTH_DATE = '1940-01-01'

/**
 * Сегодня в ISO YYYY-MM-DD (локальная дата).
 */
export function todayIsoDate() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

/**
 * Полный возраст в годах по дате рождения (ISO YYYY-MM-DD).
 * @param {string} birthDateStr
 * @returns {number|null}
 */
export function computeAgeFromBirthDate(birthDateStr) {
  if (!birthDateStr) return null
  const birth = new Date(`${birthDateStr}T12:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

/** ISO YYYY-MM-DD → дд.мм.гггг для поля ввода. */
export function isoToDisplayDate(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return ''
  return `${day}.${month}.${year}`
}

/**
 * Разбор даты из поля ввода: дд.мм.гггг, дд.мм.гг или YYYY-MM-DD.
 * @returns {string|null} ISO YYYY-MM-DD или null
 */
export function parseDisplayDate(text) {
  const trimmed = text.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidIsoDate(trimmed) ? trimmed : null
  }

  const full = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (full) {
    const iso = toIsoDate(full[3], full[2], full[1])
    return iso && isValidIsoDate(iso) ? iso : null
  }

  const short = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/)
  if (short) {
    const yy = Number(short[3])
    const year = yy >= 40 ? 1900 + yy : 2000 + yy
    const iso = toIsoDate(String(year), short[2], short[1])
    return iso && isValidIsoDate(iso) ? iso : null
  }

  return null
}

function toIsoDate(year, month, day) {
  const y = String(year)
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isValidIsoDate(iso) {
  const [y, mo, d] = iso.split('-').map(Number)
  if (!y || !mo || !d) return false
  const date = new Date(y, mo - 1, d)
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
}

/**
 * Проверка даты рождения; возвращает текст ошибки или пустую строку.
 * @param {string|null|undefined} birthDateStr
 */
export function validateDutyBirthDate(birthDateStr) {
  if (!birthDateStr) return ''
  const birth = new Date(`${birthDateStr}T12:00:00`)
  if (Number.isNaN(birth.getTime())) return 'Некорректная дата'
  if (birthDateStr < DUTY_MIN_BIRTH_DATE) return 'Не раньше 1940 года'
  if (birthDateStr > todayIsoDate()) return 'Дата не может быть в будущем'
  return ''
}

/** Подпись возраста с правильным окончанием. */
export function formatAgeLabel(age) {
  if (age == null) return null
  const mod10 = age % 10
  const mod100 = age % 100
  if (mod10 === 1 && mod100 !== 11) return `${age} год`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${age} года`
  return `${age} лет`
}

/**
 * Нормализует запись сотрудника с API: дополняет поля и вычисляет role для графика.
 * @param {object} raw — ответ /duty/employees
 */
export function normalizeEmployee(raw) {
  const vacations = Array.isArray(raw.vacations) ? raw.vacations : []
  const title = resolveDutyTitle(raw)
  const role = dutyTitleToRole(title)
  const birthDate = raw.birth_date || ''
  return {
    id: raw.id,
    name: String(raw.name || '').trim(),
    title,
    role,
    gender: raw.gender === 'M' || raw.gender === 'F' ? raw.gender : '',
    birthDate,
    age: computeAgeFromBirthDate(birthDate),
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
