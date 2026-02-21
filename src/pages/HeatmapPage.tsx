import { useQuery } from '@tanstack/react-query'
import { Info, TrendingUp, Clock, Target } from 'lucide-react'
import { analyticsHeatmap } from '@/api/analytics'
import type { HeatmapData } from '@/types/api'

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hours = Array.from({ length: 24 }, (_, i) => i)

function getHeatmapValue(heatmap: HeatmapData[], day: number, hour: number): HeatmapData | null {
  return heatmap.find((h) => h.day_of_week === day && h.hour === hour) || null
}

function getIntensity(wins: number, count: number): number {
  if (count === 0) return 0
  const winRate = wins / count
  return winRate // 0-1 scale
}

export function HeatmapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['heatmap'],
    queryFn: analyticsHeatmap,
  })

  const heatmap = data?.data ?? []

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Trading Heatmap</h1>
        <p className="page-header__subtitle">Win/loss patterns by day of week and hour</p>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading heatmap...</div>
      ) : (
        <div>
          <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, var(--color-success-muted) 0%, rgba(5, 150, 105, 0.3) 100%)',
                    border: '2px solid var(--color-success)',
                  }}
                />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Profitable</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, var(--color-error-muted) 0%, rgba(220, 38, 38, 0.3) 100%)',
                    border: '2px solid var(--color-error)',
                  }}
                />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Losses</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg-subtle)',
                    border: '2px solid var(--color-border)',
                  }}
                />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>No trades</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Info size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', margin: '0 0 var(--space-2)', color: 'var(--color-text)' }}>
                    Understanding the Trading Heatmap
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                    The heatmap visualizes your trading performance across different days of the week and hours of the day. 
                    This helps you identify patterns in your trading behavior and discover optimal times for entering trades.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <TrendingUp size={18} style={{ color: 'var(--color-success)' }} />
                    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                      Color Coding
                    </h4>
                  </div>
                  <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.8, margin: 0, paddingLeft: 'var(--space-5)' }}>
                    <li><strong style={{ color: 'var(--color-success)' }}>Green cells</strong> indicate profitable trading periods</li>
                    <li><strong style={{ color: 'var(--color-error)' }}>Red cells</strong> show periods with losses</li>
                    <li>Darker shades represent higher win rates</li>
                    <li>Gray cells indicate no trades during that time</li>
                  </ul>
                </div>

                <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <Clock size={18} style={{ color: 'var(--color-primary)' }} />
                    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                      Reading the Data
                    </h4>
                  </div>
                  <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.8, margin: 0, paddingLeft: 'var(--space-5)' }}>
                    <li><strong>Top number</strong> shows total trades in that period</li>
                    <li><strong>Middle</strong> displays wins (W) and losses (L)</li>
                    <li><strong>Bottom</strong> shows total profit amount for that time slot</li>
                    <li>Hover over cells for detailed tooltip information</li>
                  </ul>
                </div>

                <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <Target size={18} style={{ color: 'var(--color-primary)' }} />
                    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                      How to Use It
                    </h4>
                  </div>
                  <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.8, margin: 0, paddingLeft: 'var(--space-5)' }}>
                    <li>Look for clusters of green cells to find your best trading times</li>
                    <li>Identify days/hours with consistent profitability</li>
                    <li>Avoid trading during periods with many red cells</li>
                    <li>Use this data to optimize your trading schedule</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
            <div style={{ minWidth: '680px' }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: 'var(--space-2)', width: '100%' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: 'var(--space-3)',
                        textAlign: 'left',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Day / Hour
                    </th>
                    {hours.map((hour) => (
                      <th
                        key={hour}
                        style={{
                          padding: 'var(--space-2)',
                          textAlign: 'center',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--color-text-secondary)',
                          minWidth: '56px',
                        }}
                      >
                        {hour}:00
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dayNames.map((dayName, dayIdx) => (
                    <tr key={dayName}>
                      <td
                        style={{
                          padding: 'var(--space-3)',
                          fontWeight: 'var(--font-semibold)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text)',
                        }}
                      >
                        {dayName}
                      </td>
                      {hours.map((hour) => {
                        const cellData = getHeatmapValue(heatmap, dayIdx, hour)
                        const hasData = cellData && cellData.count > 0
                        const isProfit = cellData && cellData.total_pnl > 0
                        const intensity = cellData ? getIntensity(cellData.wins, cellData.count) : 0

                        return (
                          <td
                            key={`${dayIdx}-${hour}`}
                            style={{
                              padding: 'var(--space-3)',
                              textAlign: 'center',
                              fontSize: 'var(--text-xs)',
                              background: hasData
                                ? isProfit
                                  ? `linear-gradient(135deg, rgba(5, 150, 105, ${0.15 + intensity * 0.35}) 0%, rgba(5, 150, 105, ${0.05 + intensity * 0.25}) 100%)`
                                  : `linear-gradient(135deg, rgba(220, 38, 38, ${0.15 + (1 - intensity) * 0.35}) 0%, rgba(220, 38, 38, ${0.05 + (1 - intensity) * 0.25}) 100%)`
                                : 'var(--color-bg-subtle)',
                              border: `2px solid ${hasData ? (isProfit ? 'rgba(5, 150, 105, 0.3)' : 'rgba(220, 38, 38, 0.3)') : 'var(--color-border)'}`,
                              borderRadius: 'var(--radius-md)',
                              minWidth: '56px',
                              cursor: hasData ? 'pointer' : 'default',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (hasData) {
                                e.currentTarget.style.transform = 'scale(1.05)'
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                                e.currentTarget.style.zIndex = '10'
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.boxShadow = 'none'
                              e.currentTarget.style.zIndex = '1'
                            }}
                            title={
                              hasData
                                ? `${cellData.count} trades, ${cellData.wins} wins, ${cellData.losses} losses, Profit: $${cellData.total_pnl.toFixed(2)}`
                                : 'No trades'
                            }
                          >
                            {hasData && (
                              <>
                                <div
                                  style={{
                                    fontWeight: 'var(--font-bold)',
                                    fontSize: 'var(--text-sm)',
                                    color: isProfit ? 'var(--color-success)' : 'var(--color-error)',
                                    marginBottom: 'var(--space-1)',
                                  }}
                                >
                                  {cellData.count}
                                </div>
                                <div
                                  style={{
                                    fontSize: '10px',
                                    color: 'var(--color-text-secondary)',
                                    fontWeight: 'var(--font-medium)',
                                  }}
                                >
                                  {cellData.wins}W / {cellData.losses}L
                                </div>
                                {cellData.total_pnl !== 0 && (
                                  <div
                                    style={{
                                      fontSize: '9px',
                                      color: 'var(--color-text-muted)',
                                      marginTop: '2px',
                                      fontWeight: 'var(--font-medium)',
                                    }}
                                  >
                                    ${Math.abs(cellData.total_pnl).toFixed(0)}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
