import { Card, CardBody } from '@/components/ui/Card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { EquityCurvePoint } from '@/types/api'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  data: EquityCurvePoint[]
  loading?: boolean
  title?: string
}

export function EquityCurveChart({ data, loading, title = 'Equity curve' }: Props) {
  if (loading) {
    return (
      <Card>
        <CardBody>
          <h2 className="chart-title">{title}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <Spinner />
          </div>
        </CardBody>
      </Card>
    )
  }

  if (!data.length) {
    return (
      <Card>
        <CardBody>
          <h2 className="chart-title">{title}</h2>
          <div className="empty-state">No data</div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody>
        <h2 className="chart-title">{title}</h2>
        <div className="chart-container" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--color-text-secondary)" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="var(--color-text-secondary)"
                tickFormatter={(v) => (v >= 0 ? `$${v}` : `-$${Math.abs(v)}`)}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
                formatter={(value: number | undefined) =>
                  value != null
                    ? [value >= 0 ? `$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`, 'Cumulative Profit Amount']
                    : ['', 'Cumulative Profit Amount']
                }
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="cumulative_pnl"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
                name="Cumulative Profit Amount"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  )
}
