import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import * as analyticsApi from '@/api/analytics'
import type { AnalyticsParams } from '@/api/analytics'
import { getShortDisplayName } from '@/utils/displayName'
import { SummaryCards } from '@/components/SummaryCards'
import { EquityCurveChart } from '@/components/charts/EquityCurveChart'
import { WinLossDonut } from '@/components/charts/WinLossDonut'
import { PnLBarChart } from '@/components/charts/PnLBarChart'
import { BestWorstTradeCards } from '@/components/dashboard/BestWorstTradeCards'
import { Card, CardBody } from '@/components/ui/Card'

const MOTIVATIONAL_QUOTES = [
  '{name}, the best trade is sometimes the one you don\'t take.',
  'Stay disciplined, {name}. One trade at a time.',
  '{name}, plan your trade and trade your plan.',
  'Patience pays, {name}. Wait for your setup.',
  '{name}, cut your losses short and let your winners run.',
  'Review your trades, {name}. That\'s how you improve.',
  '{name}, consistency beats the occasional home run.',
  'Risk first, {name}. Then think about reward.',
  '{name}, the market will always be here tomorrow.',
  'Journal every trade, {name}. Your future self will thank you.',
]

function getQuoteOfDay(displayName: string): string {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const index = dayOfYear % MOTIVATIONAL_QUOTES.length
  const quote = MOTIVATIONAL_QUOTES[index]
  const name = displayName || 'Trader'
  return quote.replace(/\{name\}/g, name)
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

const PRESETS = [
  { label: 'Last 1 week', days: 7 },
  { label: 'Last 1 month', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last 1 year', days: 365 },
] as const

export function Dashboard() {
  const { user } = useAuth()
  const shortName = getShortDisplayName(user)
  const quoteOfDay = useMemo(() => getQuoteOfDay(shortName), [shortName])

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [isPaper, setIsPaper] = useState<boolean | undefined>(undefined)
  const dateParams: AnalyticsParams = {
    from: from || undefined,
    to: to || undefined,
    is_paper: isPaper,
  }

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'summary', dateParams],
    queryFn: () => analyticsApi.analyticsSummary(dateParams),
  })
  const { data: equityData, isLoading: equityLoading } = useQuery({
    queryKey: ['analytics', 'equity-curve', dateParams],
    queryFn: () => analyticsApi.analyticsEquityCurve(dateParams),
  })
  const { data: bySymbolData, isLoading: bySymbolLoading } = useQuery({
    queryKey: ['analytics', 'by-symbol', dateParams],
    queryFn: () => analyticsApi.analyticsBySymbol(dateParams),
  })

  const equityCurve = equityData?.data ?? []
  const bySymbol = (bySymbolData?.data ?? []).map((d) => ({ name: d.symbol, pnl: d.pnl, count: d.count }))

  const applyPreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setFrom(toDateString(start))
    setTo(toDateString(end))
  }

  const clearRange = () => {
    setFrom('')
    setTo('')
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header className="page-header" variants={itemVariants}>
        <h1 className="page-header__title">Dashboard</h1>
        <p className="page-header__subtitle">
          {shortName ? `Welcome back, ${shortName}.` : 'Overview of your trading performance'}
        </p>
        {shortName && (
          <p
            className="page-header__quote"
            style={{
              marginTop: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
              maxWidth: '36rem',
            }}
          >
            {quoteOfDay}
          </p>
        )}
      </motion.header>

      <motion.div variants={itemVariants}>
        <Card className="date-range-panel">
          <CardBody>
            <p className="date-range-panel__label">Filters</p>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginRight: 'var(--space-2)' }}>
                Quick range:
              </span>
              <div className="segment-group" style={{ flexWrap: 'wrap', display: 'inline-flex' }}>
                {PRESETS.map(({ label, days }) => (
                  <button
                    key={label}
                    type="button"
                    className="btn btn--secondary"
                    style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-1) var(--space-2)' }}
                    onClick={() => applyPreset(days)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn--ghost"
                  style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-1) var(--space-2)' }}
                  onClick={clearRange}
                >
                  All time
                </button>
              </div>
            </div>
            <div className="filter-bar">
              <div className="input-group">
                <label htmlFor="dashboard-from">From</label>
                <input
                  id="dashboard-from"
                  type="date"
                  className="input"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="dashboard-to">To</label>
                <input
                  id="dashboard-to"
                  type="date"
                  className="input"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="dashboard-trade-type">Trade type</label>
                <select
                  id="dashboard-trade-type"
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
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <SummaryCards summary={summary} loading={summaryLoading} />
      </motion.div>

      <motion.div variants={itemVariants} style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <BestWorstTradeCards dateParams={dateParams} />
      </motion.div>

      <motion.div className="dashboard-charts" variants={itemVariants}>
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
      </motion.div>
      
      <motion.div className="dashboard-charts__full" variants={itemVariants}>
        <PnLBarChart
          data={bySymbol}
          loading={bySymbolLoading}
          title="Profit Amount by symbol (top 10)"
          maxItems={10}
        />
      </motion.div>
    </motion.div>
  )
}
