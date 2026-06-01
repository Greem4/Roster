import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney } from '../utils/formatMoney'

const CHART_ACCENT = '#2dd4bf'
const CHART_LINE = '#5eead4'
const CHART_GRID = '#27272a'
const CHART_MUTED = '#71717a'

/**
 * Комбинированный график: столбцы по месяцам и сглаженная линия чуть выше вершин.
 * @param {{ label: string, amount: number, lineAmount: number }[]} data
 * @param {string} [currency='RUB']
 */
export default function PayMonthlyChart({ data, currency = 'RUB' }) {
  const hasValues = data.some((d) => d.amount > 0)
  if (!hasValues) {
    return (
      <p className="pay-analytics__chart-empty muted">
        Введите суммы за месяцы — график появится здесь.
      </p>
    )
  }

  const formatAxis = (value) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${Math.round(value / 1_000)}k`
    return String(value)
  }

  return (
    <div className="pay-analytics__chart-wrap">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 28, right: 12, left: 4, bottom: 8 }}>
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_MUTED, fontSize: 12 }}
            axisLine={{ stroke: CHART_GRID }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatAxis}
            tick={{ fill: CHART_MUTED, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: 'rgba(45, 212, 191, 0.06)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0]?.payload
              if (!row) return null
              return (
                <div className="pay-analytics__tooltip">
                  <p className="pay-analytics__tooltip-month">{row.label}</p>
                  <p className="pay-analytics__tooltip-value">
                    {formatMoney(row.amount, currency)}
                  </p>
                </div>
              )
            }}
          />
          <Bar
            dataKey="amount"
            fill={CHART_ACCENT}
            fillOpacity={0.85}
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
          <Line
            type="monotone"
            dataKey="lineAmount"
            stroke={CHART_LINE}
            strokeWidth={2.5}
            dot={{
              r: 4,
              fill: CHART_LINE,
              stroke: '#09090b',
              strokeWidth: 2,
            }}
            activeDot={{ r: 6, fill: CHART_LINE }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
