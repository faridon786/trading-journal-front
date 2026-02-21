import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { AnalyticsSummary } from '@/types/api'

interface Props {
  summary: AnalyticsSummary | undefined
  loading?: boolean
}

function formatPnl(value: number): string {
  const sign = value >= 0 ? '' : '-'
  return `${sign}$${Math.abs(value).toFixed(2)}`
}

export function SummaryCards({ summary, loading }: Props) {
  const [advancedExpanded, setAdvancedExpanded] = useState(false)

  if (loading || !summary) {
    return (
      <div className="summary-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="summary-card">
            <div className="summary-card__label" style={{ opacity: 0.6 }}>
              —
            </div>
            <div className="summary-card__value" style={{ opacity: 0.4 }}>
              —
            </div>
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Profit Amount',
      value: formatPnl(summary.total_pnl),
      valueClass: summary.total_pnl >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Win rate',
      value: summary.win_rate != null ? `${summary.win_rate.toFixed(1)}%` : '—',
      valueClass: '',
    },
    { label: 'Wins', value: String(summary.win_count), valueClass: '' },
    { label: 'Losses', value: String(summary.loss_count), valueClass: '' },
  ]

  const advancedCards = [
    {
      label: 'Profit Factor',
      value: summary.profit_factor != null ? summary.profit_factor.toFixed(2) : '—',
      valueClass: summary.profit_factor != null && summary.profit_factor >= 1.5 ? 'positive' : '',
    },
    {
      label: 'Expectancy',
      value: summary.expectancy != null ? formatPnl(summary.expectancy) : '—',
      valueClass: summary.expectancy != null && summary.expectancy >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'Sharpe Ratio',
      value: summary.sharpe_ratio != null ? summary.sharpe_ratio.toFixed(2) : '—',
      valueClass: summary.sharpe_ratio != null && summary.sharpe_ratio >= 1 ? 'positive' : '',
    },
    {
      label: 'Max Drawdown',
      value: formatPnl(summary.max_drawdown),
      valueClass: 'negative',
    },
    {
      label: 'Current Streak',
      value: `${summary.current_streak} ${summary.current_streak_type || ''}`,
      valueClass: summary.current_streak_type === 'win' ? 'positive' : summary.current_streak_type === 'loss' ? 'negative' : '',
    },
    {
      label: 'Longest Win Streak',
      value: String(summary.longest_win_streak),
      valueClass: 'positive',
    },
    {
      label: 'Longest Loss Streak',
      value: String(summary.longest_loss_streak),
      valueClass: 'negative',
    },
    {
      label: 'Max DD Duration',
      value: summary.max_drawdown_duration_days != null ? `${summary.max_drawdown_duration_days} days` : '—',
      valueClass: '',
    },
  ]

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  }

  return (
    <div>
      <div className="summary-grid">
        {cards.map((c, index) => (
          <motion.div
            key={c.label}
            className="summary-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={index}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            style={{ cursor: 'default' }}
          >
            <div className="summary-card__label">{c.label}</div>
            <div className={`summary-card__value ${c.valueClass}`.trim()}>{c.value}</div>
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop: 'var(--space-6)' }}>
        <button
          type="button"
          onClick={() => setAdvancedExpanded(!advancedExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'none',
            border: 'none',
            padding: 'var(--space-2)',
            marginLeft: 'calc(var(--space-2) * -1)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            color: 'var(--color-text)',
            fontSize: '1rem',
            fontWeight: 600,
            transition: 'background-color 0.2s ease, color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-subtle)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease',
              transform: advancedExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}
          >
            <ChevronDown size={20} />
          </div>
          <span>Advanced Metrics</span>
        </button>
        <AnimatePresence>
          {advancedExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden', marginTop: 'var(--space-4)' }}
            >
              <div className="summary-grid">
                {advancedCards.map((c, index) => (
                  <motion.div
                    key={c.label}
                    className="summary-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.4,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    style={{ cursor: 'default' }}
                  >
                    <div className="summary-card__label">{c.label}</div>
                    <div className={`summary-card__value ${c.valueClass}`.trim()}>{c.value}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
