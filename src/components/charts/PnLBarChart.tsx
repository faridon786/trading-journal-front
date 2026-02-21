import { Card, CardBody } from '@/components/ui/Card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Spinner } from '@/components/ui/Spinner'

interface BarItem {
  name: string
  pnl: number
  count?: number
}

interface Props {
  data: BarItem[]
  nameKey?: keyof BarItem
  loading?: boolean
  title?: string
  maxItems?: number
}

const PNL_COLOR_POS = 'var(--color-success)'
const PNL_COLOR_NEG = 'var(--color-error)'

export function PnLBarChart({
  data,
  nameKey = 'name',
  loading,
  title = 'Profit Amount',
  maxItems = 15,
}: Props) {
  const displayData = data.slice(0, maxItems).map((d) => ({
    name: String(d[nameKey] ?? ''),
    pnl: d.pnl,
    count: d.count,
  }))

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

  if (!displayData.length) {
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
            <BarChart
              data={displayData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--color-text-secondary)" tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} stroke="var(--color-text-secondary)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
                formatter={(value: number | undefined) =>
                  value != null ? [`$${Number(value).toFixed(2)}`, 'Profit Amount'] : ['', 'Profit Amount']
                }
                labelFormatter={(label) => label}
              />
              <Bar dataKey="pnl" name="Profit Amount" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? PNL_COLOR_POS : PNL_COLOR_NEG} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  )
}
