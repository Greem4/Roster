import { DUTY_MARK_BRIGADE, DUTY_MARK_PHONE } from '../constants'

/**
 * Ячейка дня в графике: клик переключает пусто → Б → О → пусто.
 */
export default function DutyDayCell({
  day,
  mark,
  isWeekend,
  onVacation,
  monthLabel,
  employeeName,
  onToggle,
}) {
  const className = [
    'duty-day-cell',
    isWeekend && 'duty-day-cell--weekend',
    mark === DUTY_MARK_BRIGADE && 'duty-day-cell--brigade',
    mark === DUTY_MARK_PHONE && 'duty-day-cell--phone',
  ]
    .filter(Boolean)
    .join(' ')

  const markLabel = mark === DUTY_MARK_BRIGADE
    ? 'бригада'
    : mark === DUTY_MARK_PHONE
      ? 'телефоны'
      : onVacation
        ? 'отпуск'
        : 'выходной'

  return (
    <button
      type="button"
      className={className}
      aria-pressed={Boolean(mark)}
      aria-label={`${employeeName}, ${day} ${monthLabel}, ${markLabel}`}
      onClick={onToggle}
    >
      {mark || ''}
    </button>
  )
}
