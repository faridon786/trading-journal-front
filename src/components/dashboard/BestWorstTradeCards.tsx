import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowRight, Trophy, AlertCircle } from 'lucide-react'
import { tradesList } from '@/api/trades'
import type { AnalyticsParams } from '@/api/analytics'
import { Card, CardBody } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

function formatPnl(pnl: string | number): string {
  const n = typeof pnl === 'string' ? Number(pnl) : pnl
  const sign = n >= 0 ? '' : '-'
  return `${sign}$${Math.abs(n).toFixed(2)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface BestWorstTradeCardsProps {
  dateParams?: AnalyticsParams
}

export function BestWorstTradeCards({ dateParams }: BestWorstTradeCardsProps) {
  const { data: tradesData, isLoading } = useQuery({
    queryKey: ['trades', 'best-worst', dateParams],
    queryFn: () =>
      tradesList({
        ordering: '-pnl',
        page: 1,
        from: dateParams?.from,
        to: dateParams?.to,
        is_paper: dateParams?.is_paper,
      }),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                <Spinner />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    )
  }

  const trades = tradesData?.results ?? []
  
  if (trades.length === 0) {
    return null
  }

  // Find best and worst trades
  const bestTrade = trades[0] // Already sorted by -pnl (descending)
  const worstTrade = trades.find((t) => Number(t.pnl) < 0) || trades[trades.length - 1]
  
  const bestPnl = Number(bestTrade.pnl)
  const worstPnl = Number(worstTrade.pnl)

  // Only show if we have meaningful data
  if (bestPnl <= 0 && worstPnl >= 0) {
    return null
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    }
  }

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
      {/* Best Trade Card */}
      {bestPnl > 0 && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card
            style={{
              border: '2px solid var(--color-success)',
              background: 'linear-gradient(135deg, var(--color-success-muted) 0%, rgba(5, 150, 105, 0.05) 100%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                pointerEvents: 'none',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <CardBody style={{ paddingBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <motion.div
                    variants={iconVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'linear-gradient(135deg, var(--color-success) 0%, rgba(5, 150, 105, 0.8) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                    }}
                  >
                    <Trophy size={24} style={{ color: 'white' }} />
                  </motion.div>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', margin: '0 0 var(--space-1)', color: 'var(--color-text)' }}>
                      Best Trade
                    </h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Your highest profit
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    style={{
                      fontSize: 'var(--text-3xl)',
                      fontWeight: 'var(--font-bold)',
                      color: 'var(--color-success)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatPnl(bestTrade.pnl)}
                  </motion.div>
                  <TrendingUp size={20} style={{ color: 'var(--color-success)' }} />
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <strong>{bestTrade.symbol_name}</strong> • {bestTrade.side} • {formatDate(bestTrade.exit_date)}
                </div>
                {bestTrade.strategy_name && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                    Strategy: {bestTrade.strategy_name}
                  </div>
                )}
              </div>

              <Link
                to={`/trades/${bestTrade.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--color-success)',
                  textDecoration: 'none',
                  transition: 'gap 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.gap = 'var(--space-3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.gap = 'var(--space-2)'
                }}
              >
                View details
                <ArrowRight size={16} />
              </Link>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* Worst Trade Card */}
      {worstPnl < 0 && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card
            style={{
              border: '2px solid var(--color-error)',
              background: 'linear-gradient(135deg, var(--color-error-muted) 0%, rgba(220, 38, 38, 0.05) 100%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                pointerEvents: 'none',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <CardBody style={{ paddingBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <motion.div
                    variants={iconVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'linear-gradient(135deg, var(--color-error) 0%, rgba(220, 38, 38, 0.8) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                    }}
                  >
                    <AlertCircle size={24} style={{ color: 'white' }} />
                  </motion.div>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', margin: '0 0 var(--space-1)', color: 'var(--color-text)' }}>
                      Worst Trade
                    </h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Your biggest loss
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    style={{
                      fontSize: 'var(--text-3xl)',
                      fontWeight: 'var(--font-bold)',
                      color: 'var(--color-error)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatPnl(worstTrade.pnl)}
                  </motion.div>
                  <TrendingDown size={20} style={{ color: 'var(--color-error)' }} />
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <strong>{worstTrade.symbol_name}</strong> • {worstTrade.side} • {formatDate(worstTrade.exit_date)}
                </div>
                {worstTrade.strategy_name && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                    Strategy: {worstTrade.strategy_name}
                  </div>
                )}
              </div>

              <Link
                to={`/trades/${worstTrade.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--color-error)',
                  textDecoration: 'none',
                  transition: 'gap 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.gap = 'var(--space-3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.gap = 'var(--space-2)'
                }}
              >
                Review trade
                <ArrowRight size={16} />
              </Link>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
