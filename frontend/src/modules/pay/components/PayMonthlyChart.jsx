import { useEffect, useMemo, useRef, useState } from 'react'
import { formatMoney } from '../utils/formatMoney'

const BAR_COLOR = '#2dd4bf'
const GRID_COLOR = '#27272a'
const AXIS_COLOR = '#71717a'
const AVG_COLOR = '#a1a1aa'
const MARGIN = { top: 26, right: 8, left: 40, bottom: 26 }
/** Верхние углы столбца; низ прямой — столбец стоит на базовой линии. */
const BAR_RADIUS = 4

/** Верхняя граница шкалы с «круглым» шагом (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(raw) {
  if (raw <= 0) return 1
  const exp = Math.floor(Math.log10(raw))
  const base = 10 ** exp
  const f = raw / base
  const nice = f <= 1 ? 1 : f <= 1.5 ? 1.5 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 3 ? 3 : f <= 5 ? 5 : 10
  return nice * base
}

function formatAxis(value) {
  if (value >= 1_000_000) return `${+(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}

/** Сумма для плашек над графиком — без копеек. */
function formatWhole(amount, currency) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

/** Столбец со скруглённым верхом и прямым низом. */
function barPath(x, y, w, h) {
  const r = Math.min(BAR_RADIUS, w / 2, h)
  return `M ${x} ${y + h} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h} Z`
}

/** Ширина контейнера — график рисуется в реальных пикселях, шрифт не сжимается на телефоне. */
function useWidth(ref) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

/**
 * Зарплата по месяцам: столбцы (одна серия), пунктир среднего (подписан плашкой над графиком),
 * подпись суммы только над лучшим месяцем.
 * Над графиком — «в среднем за месяц» и «лучший месяц». Тап/наведение — подсказка.
 * @param {{ label: string, fullLabel?: string, amount: number }[]} data
 * @param {string} [currency='RUB']
 */
export default function PayMonthlyChart({ data, currency = 'RUB' }) {
  const wrapRef = useRef(null)
  const width = useWidth(wrapRef)
  const [active, setActive] = useState(null)

  const filled = data.filter((d) => d.amount > 0)
  const average = filled.length ? filled.reduce((s, d) => s + d.amount, 0) / filled.length : 0
  const best = filled.reduce((top, d) => (top == null || d.amount > top.amount ? d : top), null)

  const height = width > 0 && width < 480 ? 220 : 260

  const layout = useMemo(() => {
    if (width <= 0) return null
    const plotW = width - MARGIN.left - MARGIN.right
    const plotH = height - MARGIN.top - MARGIN.bottom
    const maxY = niceMax(Math.max(...data.map((d) => d.amount), 0))
    const step = plotW / data.length
    const barW = Math.max(6, Math.min(28, step * 0.6))
    const yAt = (v) => MARGIN.top + plotH - (v / maxY) * plotH
    const bars = data.map((d, i) => {
      const cx = MARGIN.left + step * (i + 0.5)
      const h = d.amount > 0 ? Math.max(2, (d.amount / maxY) * plotH) : 0
      return { ...d, index: i, cx, x: cx - barW / 2, y: MARGIN.top + plotH - h, w: barW, h }
    })
    const ticks = [0, 0.5, 1].map((t) => ({ value: maxY * t, y: yAt(maxY * t) }))
    // Подписи месяцев: на телефоне мельче, одной буквой — только совсем узко.
    const shortLabels = step < 19
    const labelSize = step < 30 ? 10 : 11
    return { plotW, plotH, step, bars, ticks, yAt, baselineY: MARGIN.top + plotH, shortLabels, labelSize }
  }, [data, width, height])

  if (filled.length === 0) {
    return (
      <p className="pay-chart__empty muted">
        Введите суммы за месяцы — график появится здесь.
      </p>
    )
  }

  const activeBar = layout && active != null ? layout.bars[active] : null
  const avgY = layout ? layout.yAt(average) : 0

  return (
    <div className="pay-chart__body">
      <dl className="pay-chart__stats">
        <div className="pay-chart__stat">
          <dt>
            <span className="pay-chart__avg-swatch" aria-hidden />
            В среднем
          </dt>
          <dd>{formatWhole(average, currency)}</dd>
        </div>
        {best && (
          <div className="pay-chart__stat">
            <dt>Лучший месяц</dt>
            <dd>
              {formatWhole(best.amount, currency)}
              <span className="pay-chart__stat-note">{best.fullLabel ?? best.label}</span>
            </dd>
          </div>
        )}
      </dl>

      <div ref={wrapRef} className="pay-chart__wrap" onPointerLeave={() => setActive(null)}>
        {layout && (
          <svg
            className="pay-chart__svg"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Зарплата по месяцам"
          >
            {layout.ticks.map((tick) => (
              <g key={tick.value}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={tick.y}
                  y2={tick.y}
                  stroke={GRID_COLOR}
                  strokeWidth={1}
                />
                <text x={MARGIN.left - 8} y={tick.y + 4} textAnchor="end" fill={AXIS_COLOR} fontSize={11}>
                  {tick.value > 0 ? formatAxis(tick.value) : '0'}
                </text>
              </g>
            ))}

            {layout.bars.map((bar) =>
              bar.h > 0 ? (
                <path
                  key={bar.index}
                  d={barPath(bar.x, bar.y, bar.w, bar.h)}
                  fill={BAR_COLOR}
                  opacity={active == null || active === bar.index ? 1 : 0.35}
                  style={{ transition: 'opacity 0.15s ease' }}
                />
              ) : null,
            )}

            {filled.length > 1 && (
              <g>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={avgY}
                  y2={avgY}
                  stroke={AVG_COLOR}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.7}
                />
              </g>
            )}

            {/* Подпись только над лучшим месяцем (или выбранным) — не над каждым столбцом. */}
            {layout.bars
              .filter((bar) => bar.h > 0 && (activeBar ? bar === activeBar : bar.label === best?.label))
              .map((bar) => (
                <text
                  key={`v-${bar.index}`}
                  x={Math.min(Math.max(bar.cx, MARGIN.left + 18), width - MARGIN.right - 18)}
                  y={bar.y - 8}
                  textAnchor="middle"
                  fill="#f4f4f5"
                  fontSize={12}
                  fontWeight={700}
                >
                  {formatAxis(bar.amount)}
                </text>
              ))}

            {layout.bars.map((bar) => (
              <g key={`hit-${bar.index}`}>
                <rect
                  x={MARGIN.left + layout.step * bar.index}
                  y={MARGIN.top - 20}
                  width={layout.step}
                  height={layout.plotH + 20 + MARGIN.bottom}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  tabIndex={0}
                  aria-label={`${bar.fullLabel ?? bar.label}: ${formatMoney(bar.amount, currency)}`}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(bar.index)}
                  onClick={() => setActive((v) => (v === bar.index ? null : bar.index))}
                  onFocus={() => setActive(bar.index)}
                  onBlur={() => setActive(null)}
                />
                <text
                  x={bar.cx}
                  y={layout.baselineY + 17}
                  textAnchor="middle"
                  fill={active === bar.index ? '#f4f4f5' : AXIS_COLOR}
                  fontSize={layout.labelSize}
                  fontWeight={active === bar.index ? 600 : 400}
                  pointerEvents="none"
                >
                  {layout.shortLabels ? bar.label.slice(0, 1) : bar.label}
                </text>
              </g>
            ))}
          </svg>
        )}

        {activeBar && (
          <div
            className="pay-chart__tooltip pay-chart__tooltip--floating"
            style={{
              left: `${Math.min(Math.max(activeBar.cx, 70), width - 70)}px`,
              top: `${Math.max(activeBar.y - 30, 0)}px`,
            }}
          >
            <p className="pay-chart__tooltip-month">{activeBar.fullLabel ?? activeBar.label}</p>
            <p className="pay-chart__tooltip-value">
              {activeBar.amount <= 0
                ? 'нет данных'
                : Number.isInteger(activeBar.amount)
                  ? formatWhole(activeBar.amount, currency)
                  : formatMoney(activeBar.amount, currency)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
