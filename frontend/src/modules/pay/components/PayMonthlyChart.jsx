import { useId, useMemo, useState } from 'react'
import { formatMoney } from '../utils/formatMoney'

const CHART_GRID = '#27272a'
const CHART_MUTED = '#71717a'
const VIEW_W = 720
const VIEW_H = 320
const MARGIN = { top: 28, right: 12, left: 52, bottom: 32 }
/** Столбцы ниже линии: занимают не всю высоту шкалы. */
const BAR_V_SCALE = 0.8
/** Зазор между вершиной столбца и точкой линии (px). */
const LINE_GAP_MIN_PX = 12
const LINE_GAP_MAX_PX = 30

/** Ограничивает Y точки: выше столбца, но без большого отрыва. */
function clampLineY(dataY, barTopY) {
  if (barTopY == null || dataY == null) return dataY
  return Math.max(barTopY - LINE_GAP_MAX_PX, Math.min(barTopY - LINE_GAP_MIN_PX, dataY))
}

/** Прямая ломаная через точки линии. */
function buildAreaPath(points, baselineY) {
  if (points.length < 2) return ''
  let d = `M ${points[0].cx} ${points[0].lineY}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].cx} ${points[i].lineY}`
  }
  const last = points[points.length - 1]
  const first = points[0]
  return `${d} L ${last.cx} ${baselineY} L ${first.cx} ${baselineY} Z`
}

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
 * Комбинированный график зарплаты: столбцы по месяцам и линия тренда выше вершин (без recharts).
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
      const h = row.amount > 0 ? (row.amount / maxY) * plotH * BAR_V_SCALE : 0
      const barY = MARGIN.top + plotH - h
      const dataLineY = row.lineAmount > 0 ? yAt(row.lineAmount) : null
      const lineY = h > 0 ? clampLineY(dataLineY, barY) : dataLineY
      return {
        ...row,
        index: i,
        cx,
        barX: cx - barW / 2,
        barY,
        barW,
        barH: h,
        lineY,
      }
    })

    const lineDots = bars.filter((bar) => bar.lineY != null)
    const linePoints = lineDots.map((bar) => `${bar.cx},${bar.lineY}`).join(' ')
    const areaPath = buildAreaPath(lineDots, MARGIN.top + plotH)

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      value: maxY * t,
      y: yAt(maxY * t),
    }))

    return { plotW, plotH, bars, linePoints, areaPath, yTicks, baselineY: MARGIN.top + plotH }
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
          <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#99f6e4" />
          </linearGradient>
          <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5eead4" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#5eead4" stopOpacity={0} />
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

        {layout.areaPath && (
          <path d={layout.areaPath} fill={`url(#${gradientId}-area)`} />
        )}

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
          <>
            <polyline
              points={layout.linePoints}
              fill="none"
              stroke="#5eead4"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.25}
            />
            <polyline
              points={layout.linePoints}
              fill="none"
              stroke={`url(#${gradientId}-line)`}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {layout.bars.map((bar) =>
          bar.lineY != null ? (
            <g key={`dot-${bar.index}`}>
              <circle
                cx={bar.cx}
                cy={bar.lineY}
                r={hovered === bar.index ? 8 : 6}
                fill="#5eead4"
                opacity={0.35}
              />
              <circle
                cx={bar.cx}
                cy={bar.lineY}
                r={hovered === bar.index ? 5 : 4}
                fill="#ecfeff"
                stroke="#14b8a6"
                strokeWidth={2}
              />
            </g>
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
