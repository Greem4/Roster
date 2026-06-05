import { useId, useMemo, useState } from 'react'
import { formatMoney } from '../utils/formatMoney'

const CHART_LINE = '#5eead4'
const CHART_GRID = '#27272a'
const CHART_MUTED = '#71717a'
const VIEW_W = 720
const VIEW_H = 320
const MARGIN = { top: 28, right: 12, left: 52, bottom: 32 }

/** Верхняя граница оси Y с «круглым» шагом, чтобы подписи не обрезались. */
function chartMaxY(data) {
  let raw = 0
  for (const row of data) {
    raw = Math.max(raw, row.amount, row.lineAmount)
  }
  if (raw <= 0) return 1
  const exp = Math.floor(Math.log10(raw))
  const base = 10 ** exp
  const f = raw / base
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return nice * base
}

function formatAxis(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}

/**
 * Комбинированный график зарплаты: столбцы по месяцам и линия чуть выше вершин (без recharts).
 * @param {{ label: string, amount: number, lineAmount: number }[]} data
 * @param {string} [currency='RUB']
 */
export default function PayMonthlyChart({ data, currency = 'RUB' }) {
  const gradientId = useId().replace(/:/g, '')
  const [hovered, setHovered] = useState(null)

  const hasValues = data.some((d) => d.amount > 0)
  const maxY = useMemo(() => chartMaxY(data), [data])

  const layout = useMemo(() => {
    const plotW = VIEW_W - MARGIN.left - MARGIN.right
    const plotH = VIEW_H - MARGIN.top - MARGIN.bottom
    const count = data.length || 1
    const step = plotW / count
    const barW = Math.min(40, step * 0.55)

    const yAt = (value) => MARGIN.top + plotH - (value / maxY) * plotH

    const bars = data.map((row, i) => {
      const cx = MARGIN.left + step * (i + 0.5)
      const h = row.amount > 0 ? (row.amount / maxY) * plotH : 0
      return {
        ...row,
        index: i,
        cx,
        barX: cx - barW / 2,
        barY: MARGIN.top + plotH - h,
        barW,
        barH: h,
      }
    })

    const linePoints = data
      .map((row, i) => {
        if (row.lineAmount <= 0) return null
        const cx = MARGIN.left + step * (i + 0.5)
        return `${cx},${yAt(row.lineAmount)}`
      })
      .filter(Boolean)
      .join(' ')

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      value: maxY * t,
      y: yAt(maxY * t),
    }))

    return { plotW, plotH, bars, linePoints, yTicks, baselineY: MARGIN.top + plotH }
  }, [data, maxY])

  if (!hasValues) {
    return (
      <p className="pay-chart__empty muted">
        Введите суммы за месяцы — график появится здесь.
      </p>
    )
  }

  const active = hovered != null ? layout.bars[hovered] : null

  return (
    <div className="pay-chart__wrap">
      <svg
        className="pay-chart__svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="График зарплаты по месяцам"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5eead4" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.75} />
          </linearGradient>
        </defs>

        {layout.yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={MARGIN.left}
              y1={tick.y}
              x2={VIEW_W - MARGIN.right}
              y2={tick.y}
              stroke={CHART_GRID}
              strokeDasharray="3 3"
            />
            {tick.value > 0 && (
              <text
                x={MARGIN.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                fill={CHART_MUTED}
                fontSize={12}
              >
                {formatAxis(tick.value)}
              </text>
            )}
          </g>
        ))}

        {layout.bars.map((bar) =>
          bar.barH > 0 ? (
            <rect
              key={`bar-${bar.index}`}
              x={bar.barX}
              y={bar.barY}
              width={bar.barW}
              height={bar.barH}
              rx={6}
              ry={6}
              fill={`url(#${gradientId})`}
            />
          ) : null,
        )}

        {layout.linePoints && (
          <polyline
            points={layout.linePoints}
            fill="none"
            stroke={CHART_LINE}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {layout.bars.map((bar) =>
          bar.lineAmount > 0 ? (
            <circle
              key={`dot-${bar.index}`}
              cx={bar.cx}
              cy={MARGIN.top + layout.plotH - (bar.lineAmount / maxY) * layout.plotH}
              r={hovered === bar.index ? 6 : 4}
              fill={CHART_LINE}
              stroke="#09090b"
              strokeWidth={2}
            />
          ) : null,
        )}

        {layout.bars.map((bar) => (
          <g key={`hit-${bar.index}`}>
            <rect
              x={MARGIN.left + (layout.plotW / data.length) * bar.index}
              y={MARGIN.top}
              width={layout.plotW / data.length}
              height={layout.plotH}
              fill="transparent"
              onMouseEnter={() => setHovered(bar.index)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(bar.index)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
              aria-label={`${bar.label}: ${formatMoney(bar.amount, currency)}`}
            />
            <text
              x={bar.cx}
              y={layout.baselineY + 20}
              textAnchor="middle"
              fill={CHART_MUTED}
              fontSize={12}
            >
              {bar.label}
            </text>
          </g>
        ))}
      </svg>

      {active && (
        <div
          className="pay-chart__tooltip pay-chart__tooltip--floating"
          style={{
            left: `${(active.cx / VIEW_W) * 100}%`,
            top: `${((active.barY - 8) / VIEW_H) * 100}%`,
          }}
        >
          <p className="pay-chart__tooltip-month">{active.label}</p>
          <p className="pay-chart__tooltip-value">
            {formatMoney(active.amount, currency)}
          </p>
        </div>
      )}
    </div>
  )
}
