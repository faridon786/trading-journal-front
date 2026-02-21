import { useState, useEffect } from 'react'
import { Clock, TrendingUp, TrendingDown, Globe } from 'lucide-react'

interface MarketSession {
  city: string
  country: string
  timezone: string
  open: string // HH:MM format
  close: string // HH:MM format
  offset: number // UTC offset in hours
  marketName: string
  flag: string
}

const sessions: MarketSession[] = [
  { city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', open: '10:00', close: '16:00', offset: 10, marketName: 'ASX', flag: '🇦🇺' },
  { city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', open: '09:00', close: '15:00', offset: 9, marketName: 'TSE', flag: '🇯🇵' },
  { city: 'London', country: 'UK', timezone: 'Europe/London', open: '08:00', close: '16:30', offset: 0, marketName: 'LSE', flag: '🇬🇧' },
  { city: 'New York', country: 'USA', timezone: 'America/New_York', open: '09:30', close: '16:00', offset: -5, marketName: 'NYSE/NASDAQ', flag: '🇺🇸' },
]

function getCurrentTimeInTimezone(timezone: string): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
}

function isMarketOpen(session: MarketSession, now: Date): boolean {
  const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
  
  // Markets are closed on weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false
  }
  
  const [openHour, openMin] = session.open.split(':').map(Number)
  const [closeHour, closeMin] = session.close.split(':').map(Number)
  
  const openTime = new Date(now)
  openTime.setHours(openHour, openMin, 0, 0)
  
  const closeTime = new Date(now)
  closeTime.setHours(closeHour, closeMin, 0, 0)
  
  return now >= openTime && now <= closeTime
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function getTimeUntilOpen(session: MarketSession, now: Date): string | null {
  const dayOfWeek = now.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return null // Weekend
  }
  
  const [openHour, openMin] = session.open.split(':').map(Number)
  const openTime = new Date(now)
  openTime.setHours(openHour, openMin, 0, 0)
  
  if (now < openTime) {
    const diff = openTime.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `Opens in ${hours}h ${minutes}m`
    }
    return `Opens in ${minutes}m`
  }
  
  return null
}

function getTimeUntilClose(session: MarketSession, now: Date): string | null {
  const [closeHour, closeMin] = session.close.split(':').map(Number)
  const closeTime = new Date(now)
  closeTime.setHours(closeHour, closeMin, 0, 0)
  
  if (now < closeTime) {
    const diff = closeTime.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `Closes in ${hours}h ${minutes}m`
    }
    return `Closes in ${minutes}m`
  }
  
  return null
}

export function MarketSessionsPage() {
  const [currentTimes, setCurrentTimes] = useState<Record<string, Date>>({})

  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, Date> = {}
      sessions.forEach((session) => {
        times[session.city] = getCurrentTimeInTimezone(session.timezone)
      })
      setCurrentTimes(times)
    }

    updateTimes()
    const interval = setInterval(updateTimes, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="market-sessions-page">
      <div className="page-header">
        <h1 className="page-header__title">Market Sessions</h1>
        <p className="page-header__subtitle">Global trading hours and real-time market status</p>
      </div>

      <div className="market-sessions-grid">
        {sessions.map((session) => {
          const currentTime = currentTimes[session.city]
          const isOpen = currentTime ? isMarketOpen(session, currentTime) : false
          const timeStr = currentTime ? formatTime(currentTime) : '--:--'
          const timeUntilOpen = currentTime ? getTimeUntilOpen(session, currentTime) : null
          const timeUntilClose = currentTime && isOpen ? getTimeUntilClose(session, currentTime) : null
          const dayOfWeek = currentTime ? currentTime.getDay() : null
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
          const statusLabel = isOpen ? 'Open' : isWeekend ? 'Weekend' : 'Closed'

          return (
            <article
              key={session.city}
              className={`market-session-card ${isOpen ? 'market-session-card--open' : ''}`}
            >
              <div className="market-session-card__accent" aria-hidden />
              <header className="market-session-card__header">
                <div className="market-session-card__flag" aria-hidden>
                  {session.flag}
                </div>
                <div className="market-session-card__meta">
                  <h2 className="market-session-card__city">{session.city}</h2>
                  <span
                    className={`market-session-card__badge ${isOpen ? 'market-session-card__badge--open' : ''}`}
                  >
                    {statusLabel}
                  </span>
                  <p className="market-session-card__exchange">
                    {session.country} · {session.marketName}
                  </p>
                  <p className="market-session-card__tz">{session.timezone.replace('_', ' ')}</p>
                </div>
              </header>
              <div className="market-session-card__time-block">
                <div className="market-session-card__time-label">
                  <Clock size={16} aria-hidden />
                  <span>Local time</span>
                </div>
                <div className="market-session-card__time-value">{timeStr}</div>
                {(timeUntilOpen || timeUntilClose) && (
                  <div className="market-session-card__time-hint">
                    {timeUntilOpen || timeUntilClose}
                  </div>
                )}
              </div>
              <footer className="market-session-card__footer">
                <div className="market-session-card__hours-row">
                  <span className="market-session-card__hours-label">Trading hours</span>
                  {isOpen && (
                    <span className="market-session-card__live">
                      <span className="market-session-card__live-dot" aria-hidden />
                      Live
                    </span>
                  )}
                </div>
                <div className="market-session-card__hours-value">
                  {session.open} – {session.close}
                </div>
              </footer>
            </article>
          )
        })}
      </div>

      <section className="market-sessions-insights">
        <div className="market-sessions-insights__intro">
          <div className="market-sessions-insights__icon" aria-hidden>
            <Globe size={22} />
          </div>
          <div>
            <h2 className="market-sessions-insights__title">Session overlaps & insights</h2>
            <p className="market-sessions-insights__desc">
              Overlaps show when two markets are open—often the best liquidity and opportunity.
            </p>
          </div>
        </div>
        <div className="market-sessions-insights__grid">
          <div className="market-sessions-insight">
            <TrendingUp size={18} className="market-sessions-insight__icon" aria-hidden />
            <h3 className="market-sessions-insight__title">Asian–European</h3>
            <p className="market-sessions-insight__text">
              Tokyo & London overlap ~<strong>1 hour</strong> (08:00–09:00 GMT). Moderate liquidity.
            </p>
          </div>
          <div className="market-sessions-insight market-sessions-insight--highlight">
            <TrendingUp size={18} className="market-sessions-insight__icon" aria-hidden />
            <h3 className="market-sessions-insight__title">European–US</h3>
            <p className="market-sessions-insight__text">
              London & New York overlap ~<strong>4 hours</strong> (13:30–16:30 GMT). Highest liquidity.
            </p>
          </div>
          <div className="market-sessions-insight">
            <TrendingDown size={18} className="market-sessions-insight__icon" aria-hidden />
            <h3 className="market-sessions-insight__title">Low liquidity</h3>
            <p className="market-sessions-insight__text">
              Early Asia and late US often have lower volume and wider spreads.
            </p>
          </div>
        </div>
      </section>

      <style>{`
        .market-sessions-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-6);
        }
        @media (max-width: 720px) {
          .market-sessions-grid {
            grid-template-columns: 1fr;
          }
        }

        .market-session-card {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-xl);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          padding: var(--space-5);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .market-session-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        .market-session-card--open {
          border-color: var(--color-success);
          background: linear-gradient(160deg, var(--color-success-muted) 0%, var(--color-bg-elevated) 45%);
        }
        .market-session-card--open:hover {
          border-color: var(--color-success);
        }
        .market-session-card__accent {
          display: none;
        }
        .market-session-card--open .market-session-card__accent {
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--color-success), var(--color-primary));
        }
        .market-session-card__header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          margin-bottom: var(--space-5);
        }
        .market-session-card__flag {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-lg);
          background: var(--color-bg-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          flex-shrink: 0;
        }
        .market-session-card--open .market-session-card__flag {
          background: linear-gradient(145deg, var(--color-success), var(--color-primary));
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }
        .market-session-card__meta {
          flex: 1;
          min-width: 0;
        }
        .market-session-card__city {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          margin: 0 0 var(--space-1);
          color: var(--color-text);
          line-height: 1.2;
        }
        .market-session-card__badge {
          display: inline-block;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          font-size: 0.6875rem;
          font-weight: var(--font-semibold);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: var(--color-bg-subtle);
          color: var(--color-text-secondary);
        }
        .market-session-card__badge--open {
          background: var(--color-success);
          color: white;
        }
        .market-session-card__exchange {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin: var(--space-2) 0 0;
        }
        .market-session-card__tz {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          margin: var(--space-1) 0 0;
        }
        .market-session-card__time-block {
          padding: var(--space-4);
          border-radius: var(--radius-md);
          background: var(--color-bg-subtle);
          margin-bottom: var(--space-4);
        }
        .market-session-card__time-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-medium);
          margin-bottom: var(--space-2);
        }
        .market-session-card__time-label svg {
          color: var(--color-primary);
        }
        .market-session-card__time-value {
          font-size: var(--text-3xl);
          font-weight: var(--font-bold);
          font-variant-numeric: tabular-nums;
          color: var(--color-text);
          line-height: 1;
        }
        .market-session-card__time-hint {
          margin-top: var(--space-2);
          font-size: var(--text-xs);
          color: var(--color-primary);
          font-weight: var(--font-medium);
        }
        .market-session-card--open .market-session-card__time-hint {
          color: var(--color-success);
        }
        .market-session-card__footer {
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border);
        }
        .market-session-card__hours-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }
        .market-session-card__hours-label {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-medium);
        }
        .market-session-card__live {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-xs);
          color: var(--color-success);
          font-weight: var(--font-semibold);
        }
        .market-session-card__live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-success);
          animation: market-session-pulse 2s ease-in-out infinite;
        }
        .market-session-card__hours-value {
          font-size: var(--text-lg);
          font-weight: var(--font-bold);
          font-variant-numeric: tabular-nums;
          color: var(--color-text);
          letter-spacing: 0.02em;
        }
        @keyframes market-session-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .market-sessions-insights {
          margin-top: var(--space-10);
          padding: var(--space-6);
          border-radius: var(--radius-xl);
          background: linear-gradient(145deg, var(--color-bg-subtle) 0%, var(--color-bg-elevated) 100%);
          border: 1px solid var(--color-border);
        }
        .market-sessions-insights__intro {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .market-sessions-insights__icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--color-primary-muted);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .market-sessions-insights__title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          margin: 0 0 var(--space-2);
          color: var(--color-text);
        }
        .market-sessions-insights__desc {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0;
        }
        .market-sessions-insights__grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-4);
        }
        @media (max-width: 900px) {
          .market-sessions-insights__grid {
            grid-template-columns: 1fr;
          }
        }
        .market-sessions-insight {
          padding: var(--space-4);
          border-radius: var(--radius-md);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
        }
        .market-sessions-insight--highlight {
          border-color: var(--color-primary);
          background: linear-gradient(145deg, var(--color-primary-muted) 0%, var(--color-bg-elevated) 100%);
        }
        .market-sessions-insight__icon {
          color: var(--color-text-muted);
          margin-bottom: var(--space-2);
        }
        .market-sessions-insight--highlight .market-sessions-insight__icon {
          color: var(--color-primary);
        }
        .market-sessions-insight__title {
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
          margin: 0 0 var(--space-2);
          color: var(--color-text);
        }
        .market-sessions-insight__text {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: 1.55;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
