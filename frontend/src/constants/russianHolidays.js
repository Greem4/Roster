/**
 * Нерабочие праздничные дни РФ (ст. 112 ТК РФ) и переносы по постановлениям Правительства.
 * Используется для подсветки дней в графиках Duty и других календарях.
 *
 * Для годов без записи в YEAR_CALENDAR_OVERRIDES: праздники по ст. 112 + суббота/воскресенье.
 * Переносы обновлять ежегодно (постановления «О переносе выходных дней»).
 */

/** Фиксированные нерабочие праздники: «месяц-день». */
const STATUTORY_HOLIDAY_MD = new Set([
  '1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8',
  '2-23', '3-8', '5-1', '5-9', '6-12', '11-4',
])

/**
 * Уточнения производственного календаря по годам.
 * extraNonWorking — дополнительные выходные (перенос с субботы/воскресенья).
 * workingWeekends — рабочие субботы и воскресенья.
 */
const YEAR_CALENDAR_OVERRIDES = {
  2025: {
    extraNonWorking: [[5, 2], [5, 8], [6, 13], [11, 3], [12, 31]],
    workingWeekends: [[11, 1]],
  },
  2026: {
    extraNonWorking: [[1, 9], [12, 31]],
    workingWeekends: [[1, 3], [1, 4]],
  },
}

function monthDayKey(month, day) {
  return `${month}-${day}`
}

function isStatutoryHoliday(month, day) {
  return STATUTORY_HOLIDAY_MD.has(monthDayKey(month, day))
}

function getYearOverrides(year) {
  return YEAR_CALENDAR_OVERRIDES[year] || null
}

function isListedDay(list, month, day) {
  return list.some(([m, d]) => m === month && d === day)
}

/**
 * Суббота или воскресенье (0 — пн, 6 — вс).
 */
export function isWeekendByWeekdayIndex(weekdayIndex) {
  return weekdayIndex >= 5
}

/**
 * Нерабочий праздничный день по ст. 112 ТК РФ (без учёта переносов).
 */
export function isRussianStatutoryHoliday(month, day) {
  return isStatutoryHoliday(month, day)
}

/**
 * Нерабочий день по производственному календарю РФ: выходные, праздники и переносы.
 * @param {number} year — полный год
 * @param {number} month — месяц 1..12
 * @param {number} day — число месяца
 * @param {number} weekdayIndex — день недели: 0 пн … 6 вс (как в scheduleDays.weekdayIndex)
 */
export function isRussianNonWorkingDay(year, month, day, weekdayIndex) {
  const overrides = getYearOverrides(year)

  if (overrides?.workingWeekends && isListedDay(overrides.workingWeekends, month, day)) {
    return false
  }

  if (isStatutoryHoliday(month, day)) {
    return true
  }

  if (overrides?.extraNonWorking && isListedDay(overrides.extraNonWorking, month, day)) {
    return true
  }

  return isWeekendByWeekdayIndex(weekdayIndex)
}
