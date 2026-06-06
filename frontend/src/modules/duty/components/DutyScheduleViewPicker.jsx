import { SCHEDULE_VIEW_CLEAN, SCHEDULE_VIEW_DRAFT } from '../constants'

const VIEW_OPTIONS = [
  {
    id: SCHEDULE_VIEW_DRAFT,
    label: 'Черновик',
    hint: 'с ограничениями',
  },
  {
    id: SCHEDULE_VIEW_CLEAN,
    label: 'Чистовой',
    hint: 'для печати',
  },
]

/**
 * Переключатель вида графика: черновик с прочерками или чистовой без них.
 */
export default function DutyScheduleViewPicker({ value, onChange }) {
  return (
    <div
      className="duty-schedule-view"
      role="group"
      aria-label="Вид графика"
    >
      {VIEW_OPTIONS.map(({ id, label, hint }) => (
        <button
          key={id}
          type="button"
          className={[
            'duty-schedule-view__btn',
            `duty-schedule-view__btn--${id}`,
            value === id && 'duty-schedule-view__btn--active',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          <span className="duty-schedule-view__label">{label}</span>
          <span className="duty-schedule-view__hint">{hint}</span>
        </button>
      ))}
    </div>
  )
}
