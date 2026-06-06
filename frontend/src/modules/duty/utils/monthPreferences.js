import { WEEKDAY_LABELS } from '../constants/months'
import { weekdayIndex } from './scheduleDays'

/** Ключ месяца для хранения пожеланий: YYYY-MM. */
export function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

/** Пустые пожелания на один месяц. */
export function emptyMonthPreferences() {
  return {
    canWork: '',
    canWorkDays: [],
    canWorkWeekdays: [],
    avoidDays: [],
    avoidWeekdays: [],
  }
}

/** Нормализует массив чисел месяца (1–31), убирает дубли. */
export function normalizeAvoidDays(days, maxDay = 31) {
  if (!Array.isArray(days)) return []
  return [...new Set(
    days
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 1 && day <= maxDay),
  )].sort((a, b) => a - b)
}

/** Нормализует дни недели: 0 — пн, 6 — вс. */
export function normalizeAvoidWeekdays(weekdays) {
  if (!Array.isArray(weekdays)) return []
  return [...new Set(
    weekdays
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
  )].sort((a, b) => a - b)
}

/**
 * Разбор строки дней: «3, 5, 10-12» → [3, 5, 10, 11, 12].
 * @param {string} text
 * @param {number} maxDay — последний день месяца
 */
export function parseAvoidDaysFromText(text, maxDay) {
  const days = new Set()
  const parts = String(text || '').split(/[,;]+/).map((part) => part.trim()).filter(Boolean)

  for (const part of parts) {
    const range = part.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/)
    if (range) {
      const from = Number(range[1])
      const to = Number(range[2])
      const start = Math.min(from, to)
      const end = Math.max(from, to)
      for (let day = start; day <= end; day += 1) {
        if (day >= 1 && day <= maxDay) days.add(day)
      }
      continue
    }

    const single = part.match(/^(\d{1,2})$/)
    if (single) {
      const day = Number(single[1])
      if (day >= 1 && day <= maxDay) days.add(day)
    }
  }

  return normalizeAvoidDays([...days], maxDay)
}

/** Подпись выбранных дней для сводки: «3, 5, 10–12». */
export function formatAvoidDaysLabel(days) {
  const sorted = normalizeAvoidDays(days)
  if (!sorted.length) return ''

  const parts = []
  let rangeStart = sorted[0]
  let prev = sorted[0]

  for (let index = 1; index <= sorted.length; index += 1) {
    const current = sorted[index]
    if (current === prev + 1) {
      prev = current
      continue
    }

    parts.push(rangeStart === prev ? String(rangeStart) : `${rangeStart}–${prev}`)
    rangeStart = current
    prev = current
  }

  return parts.join(', ')
}

/** Подпись выбранных дней недели: «Сб, Вс». */
export function formatAvoidWeekdaysLabel(weekdays) {
  return normalizeAvoidWeekdays(weekdays).map((index) => WEEKDAY_LABELS[index]).join(', ')
}

/** Сводка правил по дням недели и числам месяца. */
export function formatMonthRulesSummary(days, weekdays) {
  const parts = []
  const weekdaysLabel = formatAvoidWeekdaysLabel(weekdays)
  const numbers = formatAvoidDaysLabel(days)
  if (weekdaysLabel) parts.push(weekdaysLabel)
  if (numbers) parts.push(`числа ${numbers}`)
  return parts.join(' · ')
}

/** Сводка правил «ставить смены» для подсказки в карточке. */
export function formatCanWorkRulesSummary(canWorkDays, canWorkWeekdays) {
  return formatMonthRulesSummary(canWorkDays, canWorkWeekdays)
}

/** Сводка правил «не ставить» для подсказки в карточке. */
export function formatAvoidRulesSummary(avoidDays, avoidWeekdays) {
  return formatMonthRulesSummary(avoidDays, avoidWeekdays)
}

/** Нормализует JSON пожеланий с API. */
export function normalizePreferencesStorage(raw) {
  if (!raw || typeof raw !== 'object') {
    return { months: {} }
  }

  const result = { months: {} }

  if (raw.months && typeof raw.months === 'object') {
    for (const [key, value] of Object.entries(raw.months)) {
      result.months[key] = {
        canWork: value?.canWork || '',
        canWorkDays: normalizeAvoidDays(value?.canWorkDays),
        canWorkWeekdays: normalizeAvoidWeekdays(value?.canWorkWeekdays),
        avoidDays: normalizeAvoidDays(value?.avoidDays),
        avoidWeekdays: normalizeAvoidWeekdays(value?.avoidWeekdays),
      }
    }
  }

  return result
}

/** Пожелания сотрудника на конкретный месяц графика. */
export function getMonthPreferences(preferences, year, month, maxDay = 31) {
  const key = monthKey(year, month)
  const stored = preferences?.months?.[key]
  if (!stored) return emptyMonthPreferences()

  return {
    canWork: stored.canWork || '',
    canWorkDays: normalizeAvoidDays(stored.canWorkDays, maxDay),
    canWorkWeekdays: normalizeAvoidWeekdays(stored.canWorkWeekdays),
    avoidDays: normalizeAvoidDays(stored.avoidDays, maxDay),
    avoidWeekdays: normalizeAvoidWeekdays(stored.avoidWeekdays),
  }
}

/** Обновляет пожелания выбранного месяца для PATCH API. */
export function patchMonthPreferences(preferences, year, month, monthPrefs, maxDay = 31) {
  const key = monthKey(year, month)
  return {
    months: {
      ...(preferences?.months || {}),
      [key]: {
        canWork: monthPrefs.canWork || '',
        canWorkDays: normalizeAvoidDays(monthPrefs.canWorkDays, maxDay),
        canWorkWeekdays: normalizeAvoidWeekdays(monthPrefs.canWorkWeekdays),
        avoidDays: normalizeAvoidDays(monthPrefs.avoidDays, maxDay),
        avoidWeekdays: normalizeAvoidWeekdays(monthPrefs.avoidWeekdays),
      },
    },
  }
}

/**
 * Все дни месяца, когда сотрудника не ставить (числа + дни недели этого месяца).
 */
export function resolveAvoidDaysForSchedule(preferences, year, month, maxDay = 31) {
  const { avoidDays, avoidWeekdays } = getMonthPreferences(preferences, year, month, maxDay)
  const days = new Set(avoidDays)

  for (let day = 1; day <= maxDay; day += 1) {
    if (avoidWeekdays.includes(weekdayIndex(year, month, day))) {
      days.add(day)
    }
  }

  return [...days].sort((a, b) => a - b)
}

/**
 * Дни месяца, когда сотрудника не ставить в смену (для алгоритма составления графика).
 */
export function avoidDaysForSchedule(preferences, year, month, maxDay = 31) {
  return resolveAvoidDaysForSchedule(preferences, year, month, maxDay)
}
