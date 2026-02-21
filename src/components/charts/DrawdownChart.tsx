import { Card, CardBody } from '@/components/ui/Card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DrawdownPoint } from '@/types/api'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  data: DrawdownPoint[]
  loading?: boolean
  title?: string
}

export function DrawdownChart({ data, loading, title = 'Drawdown' }: Props) {
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
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--color-text-secondary)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-secondary)" tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
                formatter={(value: number | undefined) =>
                  value != null ? [`$${Number(value).toFixed(2)}`, 'Drawdown'] : ['', 'Drawdown']
                }
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="var(--color-error)"
                fill="var(--color-error)"
                fillOpacity={0.3}
                name="Drawdown"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  )
}
