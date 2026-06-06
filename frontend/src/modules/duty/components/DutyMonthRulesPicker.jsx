import { useState } from 'react'
import {
  AVOID_SCOPE_MONTH,
  AVOID_SCOPE_YEAR,
  formatAvoidRulesSummary,
  formatCanWorkRulesSummary,
} from '../utils/monthPreferences'
import DutyAvoidDaysPicker from './DutyAvoidDaysPicker'
import DutyAvoidWeekdaysPicker from './DutyAvoidWeekdaysPicker'

const TABS = [
  { id: 'can', label: 'Ставить смены', hint: 'Отмечайте дни, когда можно ставить смены' },
  { id: 'avoid', label: 'Не ставить смены', hint: 'Отмечайте дни, когда смены ставить нельзя' },
]

const AVOID_SCOPE_OPTIONS = [
  { id: AVOID_SCOPE_MONTH, label: 'Только на месяц' },
  { id: AVOID_SCOPE_YEAR, label: 'На весь год' },
]

/**
 * Вкладки «ставить / не ставить» с общим календарём: дни недели, сетка месяца, быстрый ввод.
 */
export default function DutyMonthRulesPicker({
  year,
  month,
  canWorkDays,
  canWorkWeekdays,
  avoidDays,
  avoidWeekdays,
  avoidScope,
  onCanWorkDaysChange,
  onCanWorkWeekdaysChange,
  onAvoidDaysChange,
  onAvoidWeekdaysChange,
  onAvoidScopeChange,
}) {
  const [tab, setTab] = useState('can')

  const canSummary = formatCanWorkRulesSummary(canWorkDays, canWorkWeekdays)
  const avoidSummary = formatAvoidRulesSummary(avoidDays, avoidWeekdays)

  const activeTab = TABS.find(({ id }) => id === tab) ?? TABS[0]

  return (
    <div className={`duty-month-rules duty-month-rules--${tab}`}>
      <div className="duty-month-rules__tabs" role="tablist" aria-label="Пожелания по сменам">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`duty-month-rules-tab-${id}`}
            className={[
              'duty-month-rules__tab',
              `duty-month-rules__tab--${id}`,
              tab === id && 'duty-month-rules__tab--active',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-selected={tab === id}
            aria-controls={`duty-month-rules-panel-${id}`}
            onClick={() => setTab(id)}
          >
            <span className="duty-month-rules__tab-dot" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div
        id={`duty-month-rules-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`duty-month-rules-tab-${tab}`}
        className={[
          'duty-month-rules__panel',
          tab === 'can' ? 'duty-month-rules__panel--can' : 'duty-month-rules__panel--avoid',
        ].join(' ')}
      >
        <p className="duty-month-rules__mode-hint">
          <span className="duty-month-rules__mode-dot" aria-hidden />
          {activeTab.hint}
        </p>
        {tab === 'can' ? (
          <>
            <DutyAvoidWeekdaysPicker
              variant="can"
              value={canWorkWeekdays}
              onChange={onCanWorkWeekdaysChange}
            />
            <DutyAvoidDaysPicker
              variant="can"
              year={year}
              month={month}
              value={canWorkDays}
              linkedWeekdays={canWorkWeekdays}
              onChange={onCanWorkDaysChange}
            />
          </>
        ) : (
          <>
            <DutyAvoidWeekdaysPicker
              variant="avoid"
              value={avoidWeekdays}
              onChange={onAvoidWeekdaysChange}
            />
            <DutyAvoidDaysPicker
              variant="avoid"
              year={year}
              month={month}
              value={avoidDays}
              linkedWeekdays={avoidWeekdays}
              onChange={onAvoidDaysChange}
            />
          </>
        )}
      </div>

      {(canSummary || avoidSummary) && (
        <div className="duty-month-rules__summaries">
          {canSummary && (
            <p className="muted duty-month-rules__summary duty-month-rules__summary--can">
              Ставить: {canSummary}
            </p>
          )}
          {avoidSummary && (
            <div className="duty-month-rules__summary-row">
              <p className="muted duty-month-rules__summary duty-month-rules__summary--avoid">
                Не ставить: {avoidSummary}
              </p>
              <div
                className="duty-month-rules__scope"
                role="group"
                aria-label="Срок действия правил «не ставить»"
              >
                {AVOID_SCOPE_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={[
                      'duty-month-rules__scope-btn',
                      avoidScope === id && 'duty-month-rules__scope-btn--active',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={avoidScope === id}
                    onClick={() => onAvoidScopeChange(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
