import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Download, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react'
import * as analyticsApi from '@/api/analytics'
import type { PeriodType } from '@/api/analytics'
import { generatePDFReport } from '@/api/analytics'
import { SummaryCards } from '@/components/SummaryCards'
import { EquityCurveChart } from '@/components/charts/EquityCurveChart'
import { DrawdownChart } from '@/components/charts/DrawdownChart'
import { PnLBarChart } from '@/components/charts/PnLBarChart'
import { WinLossDonut } from '@/components/charts/WinLossDonut'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

function formatCurrency(value: number): string {
  const sign = value >= 0 ? '' : '-'
  return `${sign}$${Math.abs(value).toFixed(2)}`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function calcStdDev(values: number[]): number {
  if (!values.length) return 0
  const mean = values.reduce((acc, cur) => acc + cur, 0) / values.length
  const variance = values.reduce((acc, cur) => acc + (cur - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function AnalyticsPage() {
  const [tab, setTab] = useState(0)
  const [period, setPeriod] = useState<PeriodType>('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [isPaper, setIsPaper] = useState<boolean | undefined>(undefined)
  const dateParams = { from: from || undefined, to: to || undefined, is_paper: isPaper }

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'summary', dateParams],
    queryFn: () => analyticsApi.analyticsSummary(dateParams),
  })
  const { data: equityData, isLoading: equityLoading } = useQuery({
    queryKey: ['analytics', 'equity-curve', dateParams],
    queryFn: () => analyticsApi.analyticsEquityCurve(dateParams),
  })
  const { data: drawdownData, isLoading: drawdownLoading } = useQuery({
    queryKey: ['analytics', 'drawdown', dateParams],
    queryFn: () => analyticsApi.analyticsDrawdown(dateParams),
  })
  const { data: bySymbolData, isLoading: bySymbolLoading } = useQuery({
    queryKey: ['analytics', 'by-symbol', dateParams],
    queryFn: () => analyticsApi.analyticsBySymbol(dateParams),
  })
  const { data: byStrategyData, isLoading: byStrategyLoading } = useQuery({
    queryKey: ['analytics', 'by-strategy', dateParams],
    queryFn: () => analyticsApi.analyticsByStrategy(dateParams),
  })
  const { data: byPeriodData, isLoading: byPeriodLoading } = useQuery({
    queryKey: ['analytics', 'by-period', period, dateParams],
    queryFn: () => analyticsApi.analyticsByPeriod(period, dateParams),
  })

  const equityCurve = equityData?.data ?? []
  const drawdown = drawdownData?.data ?? []
  const bySymbol = (bySymbolData?.data ?? []).map((d) => ({ name: d.symbol, pnl: d.pnl, count: d.count }))
  const byStrategy = (byStrategyData?.data ?? []).map((d) => ({ name: d.strategy, pnl: d.pnl, count: d.count }))
  const byPeriod = (byPeriodData?.data ?? []).map((d) => ({ name: d.period ?? '', pnl: d.pnl, count: d.count }))
  const allTrades = summary?.total_trades ?? 0
  const profitableSymbols = bySymbol.filter((s) => s.pnl > 0).length
  const profitableStrategies = byStrategy.filter((s) => s.pnl > 0).length
  const bestSymbol = bySymbol.length ? [...bySymbol].sort((a, b) => b.pnl - a.pnl)[0] : null
  const worstSymbol = bySymbol.length ? [...bySymbol].sort((a, b) => a.pnl - b.pnl)[0] : null
  const bestStrategy = byStrategy.length ? [...byStrategy].sort((a, b) => b.pnl - a.pnl)[0] : null
  const worstStrategy = byStrategy.length ? [...byStrategy].sort((a, b) => a.pnl - b.pnl)[0] : null
  const positivePeriods = byPeriod.filter((p) => p.pnl > 0).length
  const periodConsistency = byPeriod.length ? (positivePeriods / byPeriod.length) * 100 : 0
  const avgTradesPerPeriod = byPeriod.length
    ? byPeriod.reduce((acc, cur) => acc + (cur.count ?? 0), 0) / byPeriod.length
    : 0
  const periodVolatility = calcStdDev(byPeriod.map((p) => p.pnl))
  const topSymbols = [...bySymbol].sort((a, b) => b.pnl - a.pnl).slice(0, 5)
  const bottomSymbols = [...bySymbol].sort((a, b) => a.pnl - b.pnl).slice(0, 5)
  const topStrategies = [...byStrategy].sort((a, b) => b.pnl - a.pnl).slice(0, 5)
  const bottomStrategies = [...byStrategy].sort((a, b) => a.pnl - b.pnl).slice(0, 5)

  const pdfMutation = useMutation({
    mutationFn: () => generatePDFReport(from || undefined, to || undefined),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trading_report_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    },
  })

  return (
    <div>
      <div className="page-actions">
        <header className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-header__title">Analytics</h1>
          <p className="page-header__subtitle">Deep dive into performance by symbol, strategy, and period</p>
        </header>
        <Button variant="secondary" onClick={() => pdfMutation.mutate()} disabled={pdfMutation.isPending}>
          <Download size={18} />
          Export PDF
        </Button>
      </div>

      <Card className="date-range-panel">
        <CardBody>
          <p className="date-range-panel__label">Filters</p>
          <div className="filter-bar">
            <div className="input-group">
              <label htmlFor="analytics-from">From</label>
              <input
                id="analytics-from"
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="analytics-to">To</label>
              <input
                id="analytics-to"
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="analytics-is-paper">Trade type</label>
              <select
                id="analytics-is-paper"
                className="select"
                value={isPaper === undefined ? '' : String(isPaper)}
                onChange={(e) =>
                  setIsPaper(e.target.value === '' ? undefined : e.target.value === 'true')
                }
              >
                <option value="">All</option>
                <option value="false">Actual</option>
                <option value="true">Paper</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      <SummaryCards summary={summary} loading={summaryLoading} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
              <TrendingUp size={16} />
              <span style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Best Symbol</span>
            </div>
            <div style={{ marginTop: 'var(--space-2)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
              {bestSymbol?.name ?? '—'}
            </div>
            <div className={bestSymbol && bestSymbol.pnl >= 0 ? 'positive' : 'negative'} style={{ marginTop: 'var(--space-1)' }}>
              {bestSymbol ? formatCurrency(bestSymbol.pnl) : '—'}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
              <TrendingDown size={16} />
              <span style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Worst Symbol</span>
            </div>
            <div style={{ marginTop: 'var(--space-2)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
              {worstSymbol?.name ?? '—'}
            </div>
            <div className="negative" style={{ marginTop: 'var(--space-1)' }}>
              {worstSymbol ? formatCurrency(worstSymbol.pnl) : '—'}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
              <Activity size={16} />
              <span style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Period Consistency</span>
            </div>
            <div style={{ marginTop: 'var(--space-2)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
              {formatPercent(periodConsistency)}
            </div>
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
              {positivePeriods} positive / {byPeriod.length || 0} periods
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
              <BarChart3 size={16} />
              <span style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Advanced Stats</span>
            </div>
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <div>Trades: <strong>{allTrades}</strong></div>
              <div>Volatility: <strong>{formatCurrency(periodVolatility)}</strong></div>
              <div>Avg trades/period: <strong>{avgTradesPerPeriod.toFixed(1)}</strong></div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="tabs">
        {['Overview', 'By symbol', 'By strategy', 'By period'].map((label, i) => (
          <button
            key={label}
            type="button"
            className={`tab ${tab === i ? 'tab--active' : ''}`}
            onClick={() => setTab(i)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="dashboard-charts">
          <div className="dashboard-charts__main">
            <EquityCurveChart data={equityCurve} loading={equityLoading} />
          </div>
          <div className="dashboard-charts__side">
            <WinLossDonut
              winCount={summary?.win_count ?? 0}
              lossCount={summary?.loss_count ?? 0}
              loading={summaryLoading}
            />
          </div>
          <div className="dashboard-charts__full">
            <DrawdownChart data={drawdown} loading={drawdownLoading} />
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <PnLBarChart data={bySymbol} loading={bySymbolLoading} title="Profit Amount by symbol" maxItems={20} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            <Card>
              <CardBody>
                <h3 className="chart-title">Top symbols</h3>
                {topSymbols.length ? (
                  <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                    {topSymbols.map((s) => (
                      <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span>{s.name} <span style={{ color: 'var(--color-text-muted)' }}>({s.count})</span></span>
                        <strong className={s.pnl >= 0 ? 'positive' : 'negative'}>{formatCurrency(s.pnl)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No data</div>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <h3 className="chart-title">Bottom symbols</h3>
                {bottomSymbols.length ? (
                  <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                    {bottomSymbols.map((s) => (
                      <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span>{s.name} <span style={{ color: 'var(--color-text-muted)' }}>({s.count})</span></span>
                        <strong className={s.pnl >= 0 ? 'positive' : 'negative'}>{formatCurrency(s.pnl)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No data</div>
                )}
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardBody>
              <h3 className="chart-title">Symbol quality</h3>
              <p className="page-header__subtitle" style={{ marginBottom: 'var(--space-2)' }}>
                {profitableSymbols} profitable symbols out of {bySymbol.length || 0}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <PnLBarChart data={byStrategy} loading={byStrategyLoading} title="Profit Amount by strategy" maxItems={20} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            <Card>
              <CardBody>
                <h3 className="chart-title">Top strategies</h3>
                {topStrategies.length ? (
                  <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                    {topStrategies.map((s) => (
                      <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span>{s.name || 'No strategy'} <span style={{ color: 'var(--color-text-muted)' }}>({s.count})</span></span>
                        <strong className={s.pnl >= 0 ? 'positive' : 'negative'}>{formatCurrency(s.pnl)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No data</div>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <h3 className="chart-title">Bottom strategies</h3>
                {bottomStrategies.length ? (
                  <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                    {bottomStrategies.map((s) => (
                      <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span>{s.name || 'No strategy'} <span style={{ color: 'var(--color-text-muted)' }}>({s.count})</span></span>
                        <strong className={s.pnl >= 0 ? 'positive' : 'negative'}>{formatCurrency(s.pnl)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No data</div>
                )}
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardBody>
              <h3 className="chart-title">Strategy quality</h3>
              <p className="page-header__subtitle" style={{ marginBottom: 'var(--space-2)' }}>
                {profitableStrategies} profitable strategies out of {byStrategy.length || 0}
              </p>
              <p className="page-header__subtitle">
                Best: <strong>{bestStrategy?.name ?? '—'}</strong> ({bestStrategy ? formatCurrency(bestStrategy.pnl) : '—'}) · Worst: <strong>{worstStrategy?.name ?? '—'}</strong> ({worstStrategy ? formatCurrency(worstStrategy.pnl) : '—'})
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 3 && (
        <div>
          <p className="date-range-panel__label">Group by</p>
          <div className="segment-group" style={{ marginBottom: 'var(--space-4)' }}>
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`btn ${period === p ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <PnLBarChart data={byPeriod} loading={byPeriodLoading} title={`Profit Amount by ${period}`} maxItems={31} />
        </div>
      )}
    </div>
  )
}
