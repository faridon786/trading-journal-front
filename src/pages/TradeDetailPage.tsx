import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { tradeGet } from '@/api/trades'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { ScreenshotView } from '@/components/ui/ScreenshotView'
import { Spinner } from '@/components/ui/Spinner'

function formatPnl(pnl: string): string {
  const n = Number(pnl)
  const sign = n >= 0 ? '' : '-'
  return `${sign}$${Math.abs(n).toFixed(2)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function screenshotUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/api\/?$/, '')
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export function TradeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const tradeId = id != null ? Number(id) : NaN

  const { data: trade, isLoading, error } = useQuery({
    queryKey: ['trade', id],
    queryFn: () => tradeGet(tradeId),
    enabled: Number.isInteger(tradeId) && tradeId > 0,
  })

  if (!id || !Number.isInteger(tradeId) || tradeId <= 0) {
    return (
      <div>
        <BackButton fallback="/trades" />
        <div className="alert alert--error">Invalid trade ID</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        <BackButton fallback="/trades" />
        <div className="loading-state">
          <Spinner />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Loading trade…</span>
        </div>
      </div>
    )
  }

  if (error || !trade) {
    return (
      <div>
        <BackButton fallback="/trades" />
        <div className="alert alert--error">Trade not found</div>
      </div>
    )
  }

  const pnlNum = Number(trade.pnl)

  return (
    <div>
      <div className="page-actions">
        <BackButton fallback="/trades" />
        <Link to={`/trades/${trade.id}/edit`} state={{ from: `/trades/${trade.id}` }}>
          <Button variant="primary">
            <Pencil size={18} />
            Edit
          </Button>
        </Link>
      </div>

      <header className="page-header">
        <h1 className="page-header__title">
          {trade.symbol_name} — {trade.side}
        </h1>
        <p className="page-header__subtitle">
          {formatDate(trade.exit_date)}
          {trade.strategy_name && ` · ${trade.strategy_name}`}
        </p>
      </header>

      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <Card>
          <CardBody>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
              Trade details
            </h2>
            <div className="form-grid" style={{ gap: 'var(--space-4)' }}>
              <div className="input-group">
                <span className="input-helper">Symbol</span>
                <p style={{ margin: 0, fontWeight: 'var(--font-medium)' }}>{trade.symbol_name}</p>
              </div>
              <div className="input-group">
                <span className="input-helper">Side</span>
                <p style={{ margin: 0, fontWeight: 'var(--font-medium)' }}>{trade.side}</p>
              </div>
              <div className="input-group">
                <span className="input-helper">Type</span>
                <p style={{ margin: 0 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-medium)',
                      background: trade.is_paper ? 'var(--color-primary-muted)' : 'var(--color-success-muted)',
                      color: trade.is_paper ? 'var(--color-primary-hover)' : 'var(--color-success)',
                    }}
                  >
                    {trade.is_paper ? 'Paper' : 'Actual'}
                  </span>
                </p>
              </div>
              <div className="input-group">
                <span className="input-helper">Entry price</span>
                <p style={{ margin: 0, fontWeight: 'var(--font-medium)' }}>${Number(trade.entry_price).toFixed(2)}</p>
              </div>
              <div className="input-group">
                <span className="input-helper">Exit price</span>
                <p style={{ margin: 0, fontWeight: 'var(--font-medium)' }}>${Number(trade.exit_price).toFixed(2)}</p>
              </div>
              <div className="input-group">
                <span className="input-helper">Entry date</span>
                <p style={{ margin: 0 }}>{formatDate(trade.entry_date)}</p>
              </div>
              <div className="input-group">
                <span className="input-helper">Exit date</span>
                <p style={{ margin: 0 }}>{formatDate(trade.exit_date)}</p>
              </div>
              <div className="input-group">
                <span className="input-helper">Profit Amount</span>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 'var(--font-bold)',
                    fontSize: 'var(--text-xl)',
                    color: pnlNum >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                  }}
                >
                  {formatPnl(trade.pnl)}
                </p>
              </div>
              <div className="input-group">
                <span className="input-helper">Strategy</span>
                <p style={{ margin: 0 }}>{trade.strategy_name ?? '—'}</p>
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <span className="input-helper">Tags</span>
                <p style={{ margin: 0 }}>
                  {trade.tags?.length ? trade.tags.map((t) => t.name).join(', ') : '—'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {trade.screenshot && (
          <Card>
            <CardBody>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
                Screenshot
              </h2>
              <ScreenshotView
                src={screenshotUrl(trade.screenshot)}
                alt="Trade screenshot"
                variant="card"
              />
            </CardBody>
          </Card>
        )}

        {(trade.emotion_rating != null || trade.emotion_notes) && (
          <Card>
            <CardBody>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
                Emotion
              </h2>
              {trade.emotion_rating != null && (
                <p style={{ margin: '0 0 var(--space-2)' }}>
                  <span className="input-helper">Rating</span> {trade.emotion_rating}/5
                </p>
              )}
              {trade.emotion_notes && (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{trade.emotion_notes}</p>
              )}
            </CardBody>
          </Card>
        )}

        {trade.notes && (
          <Card>
            <CardBody>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
                Notes
              </h2>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{trade.notes}</p>
            </CardBody>
          </Card>
        )}

        {trade.pre_trade_plan && (
          <Card>
            <CardBody>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
                Pre-trade plan
              </h2>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{trade.pre_trade_plan}</p>
            </CardBody>
          </Card>
        )}

        {trade.post_trade_review && (
          <Card>
            <CardBody>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
                Post-trade review
              </h2>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{trade.post_trade_review}</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
