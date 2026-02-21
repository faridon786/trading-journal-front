import { Card, CardBody } from '@/components/ui/Card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  winCount: number
  lossCount: number
  loading?: boolean
  title?: string
}

const WIN_COLOR = 'var(--color-success)'
const LOSS_COLOR = 'var(--color-error)'

export function WinLossDonut({
  winCount,
  lossCount,
  loading,
  title = 'Wins vs Losses',
}: Props) {
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

  const total = winCount + lossCount
  if (total === 0) {
    return (
      <Card>
        <CardBody>
          <h2 className="chart-title">{title}</h2>
          <div className="empty-state">No data</div>
        </CardBody>
      </Card>
    )
  }

  const data = [
    { name: 'Wins', value: winCount, color: WIN_COLOR },
    { name: 'Losses', value: lossCount, color: LOSS_COLOR },
  ]

  const winRate = total > 0 ? ((winCount / total) * 100).toFixed(1) : '0.0'
  const winPct = total > 0 ? ((winCount / total) * 100).toFixed(1) : '0.0'
  const lossPct = total > 0 ? ((lossCount / total) * 100).toFixed(1) : '0.0'

  return (
    <Card>
      <CardBody>
        <h2 className="chart-title">{title}</h2>
        <div className="chart-container win-loss-donut-wrap" style={{ position: 'relative' }}>
          {/* Chart area only - no legend inside, so pie center is exactly 50% */}
          <div style={{ height: 320, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={130}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text)',
                  }}
                  labelStyle={{
                    color: 'var(--color-text)',
                  }}
                  itemStyle={{
                    color: 'var(--color-text)',
                  }}
                  formatter={(value, name, item) => {
                    const payload = item?.payload as { percent?: number; value?: number } | undefined
                    const numValue = typeof value === 'number' ? value : Number(value ?? payload?.value ?? 0)
                    const percent =
                      typeof payload?.percent === 'number'
                        ? payload.percent * 100
                        : total > 0
                          ? (Number(numValue) / total) * 100
                          : 0
                    return [`${numValue} (${percent.toFixed(1)}%)`, String(name ?? '')]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text - same 320px box, so 50% is exactly the circle centre */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                width: '100%',
              }}
            >
              <div
                className="win-loss-center-value"
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--color-success)',
                  marginBottom: 'var(--space-1)',
                  fontFamily: 'monospace',
                }}
              >
                {winRate}%
              </div>
              <div
                className="win-loss-center-label"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 'var(--font-medium)',
                }}
              >
                Win Rate
              </div>
              <div
                className="win-loss-center-muted"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  marginTop: 'var(--space-1)',
                }}
              >
                {total} total trades
              </div>
            </div>
          </div>
          {/* Legend as separate row so pie and overlay share same coordinate system */}
          <div
            className="win-loss-legend-text"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-6)',
              marginTop: 'var(--space-4)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: WIN_COLOR }} />
              Wins: <strong>{winCount}</strong> ({winPct}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: LOSS_COLOR }} />
              Losses: <strong>{lossCount}</strong> ({lossPct}%)
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
