import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { analyticsCalendar } from '@/api/analytics'
import { Link } from 'react-router-dom'
import type { CalendarTrade } from '@/types/api'
import { Modal } from '@/components/ui/Modal'

function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? '' : '-'
  return `${sign}$${Math.abs(pnl).toFixed(2)}`
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => analyticsCalendar(year, month),
  })

  const tradesByDate = new Map<string, CalendarTrade>()
  data?.data.forEach((item) => {
    tradesByDate.set(item.date, item)
  })

  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.
  const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 // Convert to Mon=0, Sun=6

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const prevMonth = () => {
    setSelectedDate(null)
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const nextMonth = () => {
    setSelectedDate(null)
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const days = []
  // Empty cells for days before month starts
  for (let i = 0; i < adjustedStart; i++) {
    days.push(null)
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Trade Calendar</h1>
        <p className="page-header__subtitle">View your trades by date</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <button onClick={prevMonth} className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ChevronLeft size={18} />
          Previous
        </button>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)' }}>
          {monthNames[month - 1]} {year}
        </h2>
        <button onClick={nextMonth} className="btn btn--secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          Next
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading calendar...</div>
      ) : (
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 'var(--space-3)',
          }}>
            {dayNames.map((day) => (
              <div
                key={day}
                style={{
                  padding: 'var(--space-3)',
                  textAlign: 'center',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--text-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {day}
              </div>
            ))}
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} style={{ aspectRatio: '1' }} />
              }
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const tradeData = tradesByDate.get(dateStr)
              const hasTrades = tradeData && tradeData.count > 0
              const isProfit = tradeData && tradeData.total_pnl > 0
              const isToday = new Date().toISOString().split('T')[0] === dateStr

              return (
                <div
                  key={day}
                  role={hasTrades ? 'button' : undefined}
                  tabIndex={hasTrades ? 0 : undefined}
                  onClick={() => hasTrades && setSelectedDate(dateStr)}
                  onKeyDown={(e) => hasTrades && (e.key === 'Enter' || e.key === ' ') && setSelectedDate(dateStr)}
                  style={{
                    aspectRatio: '1',
                    border: `2px solid ${isToday ? 'var(--color-primary)' : hasTrades ? (isProfit ? 'var(--color-success)' : 'var(--color-error)') : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: hasTrades
                      ? isProfit
                        ? 'linear-gradient(135deg, var(--color-success-muted) 0%, rgba(5, 150, 105, 0.1) 100%)'
                        : 'linear-gradient(135deg, var(--color-error-muted) 0%, rgba(220, 38, 38, 0.1) 100%)'
                      : isToday
                        ? 'var(--color-primary-muted)'
                        : 'var(--color-bg-elevated)',
                    cursor: hasTrades ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    boxShadow: hasTrades ? 'var(--shadow-sm)' : 'none',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (hasTrades) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = hasTrades ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  {isToday && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontWeight: 'var(--font-semibold)',
                      fontSize: 'var(--text-base)',
                      color: isToday ? 'var(--color-primary)' : 'var(--color-text)',
                      marginBottom: hasTrades ? 'var(--space-2)' : 0,
                    }}
                  >
                    {day}
                  </div>
                  {hasTrades && (
                    <>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-semibold)',
                          color: isProfit ? 'var(--color-success)' : 'var(--color-error)',
                          marginBottom: 'var(--space-1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{formatPnl(tradeData.total_pnl)}</span>
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-text-muted)',
                          fontWeight: 'var(--font-medium)',
                        }}
                      >
                        {tradeData.count} trade{tradeData.count !== 1 ? 's' : ''}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selectedDate && (() => {
        const tradeData = tradesByDate.get(selectedDate)
        if (!tradeData || tradeData.count === 0) return null
        return (
          <Modal
            open={true}
            onClose={() => setSelectedDate(null)}
            title={`Trades on ${formatDisplayDate(selectedDate)}`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {tradeData.trades.map((t) => (
                <Link
                  key={t.id}
                  to={`/trades/${t.id}`}
                  onClick={() => setSelectedDate(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3)',
                    background: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 'var(--font-semibold)' }}>{t.symbol}</span>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>{t.side}</span>
                    {t.strategy && (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginLeft: 'var(--space-2)' }}>
                        · {t.strategy}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span
                      style={{
                        fontWeight: 'var(--font-semibold)',
                        color: t.pnl >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                      }}
                    >
                      {formatPnl(t.pnl)}
                    </span>
                    <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                </Link>
              ))}
            </div>
            <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Total: {formatPnl(tradeData.total_pnl)} ({tradeData.count} trade{tradeData.count !== 1 ? 's' : ''})
            </p>
          </Modal>
        )
      })()}
    </div>
  )
}
