import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { compareTrades } from '@/api/trades'
import { tradesList } from '@/api/trades'
import { Link } from 'react-router-dom'

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

export function CompareTradesPage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [search, setSearch] = useState('')

  const { data: tradesData } = useQuery({
    queryKey: ['trades', { search }],
    queryFn: () => tradesList({ search, page: 1 }),
  })

  const { data: compareData } = useQuery({
    queryKey: ['compare', selectedIds],
    queryFn: () => compareTrades(selectedIds),
    enabled: selectedIds.length > 0,
  })

  const trades = tradesData?.results ?? []
  const compareTradesList = compareData?.trades ?? []

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id)
      }
      if (prev.length >= 4) {
        return prev
      }
      return [...prev, id]
    })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Compare Trades</h1>
        <p className="page-header__subtitle">Select up to 4 trades to compare side by side</p>
      </div>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div className="input-group" style={{ maxWidth: '400px' }}>
          <label htmlFor="search">Search trades</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 'var(--space-2)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
            <input
              id="search"
              type="text"
              className="input"
              placeholder="Search symbols, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 'var(--font-medium)' }}>Selected: {selectedIds.length}/4</span>
            <button
              onClick={() => setSelectedIds([])}
              className="btn btn--secondary"
              style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)' }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {compareTradesList.length > 0 && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
            Comparison
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: '680px' }}>
              <thead>
                <tr>
                  <th>Metric</th>
                  {compareTradesList.map((trade) => (
                    <th key={trade.id} style={{ textAlign: 'center' }}>
                      <Link to={`/trades/${trade.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {trade.symbol_name} ({formatDate(trade.exit_date)})
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Symbol</strong></td>
                  {compareTradesList.map((trade) => (
                    <td key={trade.id} style={{ textAlign: 'center' }}>{trade.symbol}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Side</strong></td>
                  {compareTradesList.map((trade) => (
                    <td key={trade.id} style={{ textAlign: 'center' }}>{trade.side}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Entry Price</strong></td>
                  {compareTradesList.map((trade) => (
                    <td key={trade.id} style={{ textAlign: 'center' }}>${Number(trade.entry_price).toFixed(2)}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Exit Price</strong></td>
                  {compareTradesList.map((trade) => (
                    <td key={trade.id} style={{ textAlign: 'center' }}>${Number(trade.exit_price).toFixed(2)}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Profit Amount</strong></td>
                  {compareTradesList.map((trade) => (
                    <td
                      key={trade.id}
                      style={{
                        textAlign: 'center',
                        color: Number(trade.pnl) >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                        fontWeight: 'var(--font-semibold)',
                      }}
                    >
                      {formatPnl(trade.pnl)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Strategy</strong></td>
                  {compareTradesList.map((trade) => (
                    <td key={trade.id} style={{ textAlign: 'center' }}>{trade.strategy_name || '—'}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Entry Date</strong></td>
                  {compareTradesList.map((trade) => (
                    <td key={trade.id} style={{ textAlign: 'center' }}>{formatDate(trade.entry_date)}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Exit Date</strong></td>
                  {compareTradesList.map((trade) => (
                    <td key={trade.id} style={{ textAlign: 'center' }}>{formatDate(trade.exit_date)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
          Select Trades
        </h2>
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {trades.map((trade) => {
            const isSelected = selectedIds.includes(trade.id)
            return (
              <div
                key={trade.id}
                onClick={() => toggleSelect(trade.id)}
                style={{
                  padding: 'var(--space-4)',
                  border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--color-primary-muted)' : 'var(--color-bg-elevated)',
                  cursor: selectedIds.length >= 4 && !isSelected ? 'not-allowed' : 'pointer',
                  opacity: selectedIds.length >= 4 && !isSelected ? 0.5 : 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'var(--font-semibold)' }}>{trade.symbol_name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {formatDate(trade.exit_date)} • {trade.strategy_name || 'No strategy'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontWeight: 'var(--font-semibold)',
                      color: Number(trade.pnl) >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                    }}
                  >
                    {formatPnl(trade.pnl)}
                  </div>
                  {isSelected && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', marginTop: 'var(--space-1)' }}>
                      Selected
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
