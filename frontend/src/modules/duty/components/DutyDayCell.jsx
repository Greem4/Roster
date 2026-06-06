import { DUTY_MARK_BLOCKED, DUTY_MARK_BRIGADE, DUTY_MARK_PHONE } from '../constants'

/**
 * Ячейка дня в графике: клик переключает пусто → Б → О → пусто.
 * В черновике показывает прочерк, если сотрудник не может работать в этот день.
 */
export default function DutyDayCell({
  day,
  mark,
  isWeekend,
  onVacation,
  isBlocked,
  showRestrictions,
  monthLabel,
  employeeName,
  onToggle,
}) {
  const showBlockedDash = showRestrictions && isBlocked && !mark && !onVacation

  const className = [
    'duty-day-cell',
    isWeekend && 'duty-day-cell--weekend',
    mark === DUTY_MARK_BRIGADE && 'duty-day-cell--brigade',
    mark === DUTY_MARK_PHONE && 'duty-day-cell--phone',
    showBlockedDash && 'duty-day-cell--blocked',
  ]
    .filter(Boolean)
    .join(' ')

  const markLabel = mark === DUTY_MARK_BRIGADE
    ? 'бригада'
    : mark === DUTY_MARK_PHONE
      ? 'телефоны'
      : onVacation
        ? 'отпуск'
        : showBlockedDash
          ? 'нельзя ставить смену'
          : 'выходной'

  return (
    <button
      type="button"
      className={className}
      aria-pressed={Boolean(mark)}
      aria-label={`${employeeName}, ${day} ${monthLabel}, ${markLabel}`}
      onClick={onToggle}
    >
      {mark || (showBlockedDash ? DUTY_MARK_BLOCKED : '')}
    </button>
  )
}
