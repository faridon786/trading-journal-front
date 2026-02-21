import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, TrendingUp, Copy, Search, ArrowUpDown, ArrowUp, ArrowDown, X, Download, Upload, Plus } from 'lucide-react'
import { tradesList, tradeDelete, bulkDeleteTrades, bulkTagTrades, duplicateTrade, exportTradesCSV, importTradesCSV, type TradesListParams } from '@/api/trades'
import { strategiesList } from '@/api/strategies'
import { symbolsList } from '@/api/symbols'
import { tagsList } from '@/api/tags'
import type { Trade } from '@/types/api'
import { DeleteConfirmDialog } from '@/components/trades/DeleteConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ScreenshotView } from '@/components/ui/ScreenshotView'

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
  })
}

function screenshotUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const base = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/api\/?$/, '')
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

type SortField = 'exit_date' | 'symbol' | 'side' | 'pnl' | 'entry_date'
type SortDirection = 'asc' | 'desc'

export function TradesPage() {
  const [page, setPage] = useState(0)
  const pageSize = 50
  const [filters, setFilters] = useState<Pick<TradesListParams, 'from' | 'to' | 'symbol' | 'strategy' | 'is_paper' | 'search'>>({})
  const [searchInput, setSearchInput] = useState('') // debounced into filters.search
  const [sortField, setSortField] = useState<SortField>('exit_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkTagOpen, setBulkTagOpen] = useState(false)
  const [bulkTagIds, setBulkTagIds] = useState<number[]>([])
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const location = useLocation()
  
  // Create return path with current state
  const returnPath = location.pathname + location.search

  // Debounce search: update filters after 300ms of no typing to avoid a request per keystroke
  const lastAppliedSearchRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput || undefined
      if (lastAppliedSearchRef.current === next) return
      lastAppliedSearchRef.current = next
      setFilters((f) => ({ ...f, search: next }))
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const ordering =
    sortField === 'symbol'
      ? sortDirection === 'desc'
        ? '-symbol__name'
        : 'symbol__name'
      : sortDirection === 'desc'
        ? `-${sortField}`
        : sortField
  const params: TradesListParams = { page: page + 1, ...filters, ordering }
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['trades', params],
    queryFn: () => tradesList(params),
    retry: 1,
  })

  const { data: strategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: strategiesList,
    staleTime: 5 * 60 * 1000, // 5 min — rarely change
  })

  const { data: symbols } = useQuery({
    queryKey: ['symbols'],
    queryFn: symbolsList,
    staleTime: 5 * 60 * 1000,
  })

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsList,
    staleTime: 5 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: tradeDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      setDeleteId(null)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteTrades,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
    },
  })

  const bulkTagMutation = useMutation({
    mutationFn: ({ ids, tagIds, action }: { ids: number[]; tagIds: number[]; action: 'add' | 'remove' }) =>
      bulkTagTrades(ids, tagIds, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      setSelectedIds(new Set())
      setBulkTagOpen(false)
      setBulkTagIds([])
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: duplicateTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
    },
  })

  const exportMutation = useMutation({
    mutationFn: () => exportTradesCSV(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trades_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    },
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => importTradesCSV(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      setImportOpen(false)
      setImportFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      alert(`Imported ${result.created} trades${result.total_errors > 0 ? ` (${result.total_errors} errors)` : ''}`)
    },
  })

  const trades = data?.results ?? []
  const count = data?.count ?? 0
  const totalPages = Math.ceil(count / pageSize) || 1

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === trades.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(trades.map((t) => t.id)))
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
    }
    return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
  }

  return (
    <div>
      <div className="page-actions">
        <header className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-header__title">Trades</h1>
          <p className="page-header__subtitle">View and manage your trade history</p>
        </header>
        <div className="segment-group">
          <Link to="/trades/new" className="btn btn--primary" style={{ textDecoration: 'none' }}>
            <Plus size={18} />
            New trade
          </Link>
          <Button
            variant="secondary"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download size={18} />
            Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setImportOpen(true)
              fileInputRef.current?.click()
            }}
          >
            <Upload size={18} />
            Import CSV
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="input-group" style={{ flex: '1 1 300px', minWidth: '200px' }}>
          <label htmlFor="filter-search">Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 'var(--space-2)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
            <input
              id="filter-search"
              type="text"
              className="input"
              placeholder="Search symbols, notes, strategies, tags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  lastAppliedSearchRef.current = undefined
                  setFilters((f) => ({ ...f, search: undefined }))
                  setPage(0)
                }}
                style={{
                  position: 'absolute',
                  right: 'var(--space-2)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 'var(--space-1)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="filter-from">From</label>
          <input
            id="filter-from"
            type="date"
            className="input"
            value={filters.from ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="filter-to">To</label>
          <input
            id="filter-to"
            type="date"
            className="input"
            value={filters.to ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
          />
        </div>
        <div className="input-group">
          <label htmlFor="filter-symbol">Symbol</label>
          <select
            id="filter-symbol"
            className="select"
            value={filters.symbol ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                symbol: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          >
            <option value="">All</option>
            {(symbols ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="filter-strategy">Strategy</label>
          <select
            id="filter-strategy"
            className="select"
            value={filters.strategy ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                strategy: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          >
            <option value="">All</option>
            {(strategies ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="filter-is-paper">Trade type</label>
          <select
            id="filter-is-paper"
            className="select"
            value={filters.is_paper === undefined ? '' : String(filters.is_paper)}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                is_paper: e.target.value === '' ? undefined : e.target.value === 'true',
              }))
            }
          >
            <option value="">All</option>
            <option value="false">Actual</option>
            <option value="true">Paper</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-primary-muted)',
          border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}>
          <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-primary-hover)' }}>
            {selectedIds.size} trade{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              onClick={() => setBulkTagOpen(true)}
            >
              Tag
            </Button>
            <Button
              variant="danger"
              onClick={() => setBulkDeleteOpen(true)}
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert--error" role="alert">
          <strong>Failed to load trades</strong>
          <br />
          {error instanceof Error ? error.message : 'Unknown error'}
          <br />
          <small>Check browser console for details. Make sure you're logged in as frasa0118 to see demo data.</small>
        </div>
      )}

      <div className="table-wrap">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Loading trades…</span>
          </div>
        ) : trades.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon" aria-hidden>
              <TrendingUp size={28} />
            </div>
            <p className="empty-state__title">No trades yet</p>
            <p>
              {data?.count === 0
                ? 'Record your first trade to start tracking performance.'
                : 'No trades match your current filters. Try clearing the filters or check if you\'re logged in as frasa0118 to see demo data.'}
            </p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === trades.length && trades.length > 0}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer' }}
                      aria-label="Select all"
                    />
                  </th>
                  <th></th>
                  <th>
                    <button
                      type="button"
                      onClick={() => handleSort('symbol')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit',
                        fontWeight: 'inherit',
                        color: 'inherit',
                      }}
                    >
                      Symbol
                      {getSortIcon('symbol')}
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      onClick={() => handleSort('side')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit',
                        fontWeight: 'inherit',
                        color: 'inherit',
                      }}
                    >
                      Side
                      {getSortIcon('side')}
                    </button>
                  </th>
                  <th>Type</th>
                  <th>
                    <button
                      type="button"
                      onClick={() => handleSort('exit_date')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit',
                        fontWeight: 'inherit',
                        color: 'inherit',
                      }}
                    >
                      Exit date
                      {getSortIcon('exit_date')}
                    </button>
                  </th>
                  <th className="numeric">
                    <button
                      type="button"
                      onClick={() => handleSort('pnl')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit',
                        fontWeight: 'inherit',
                        color: 'inherit',
                        marginLeft: 'auto',
                      }}
                    >
                      Profit Amount
                      {getSortIcon('pnl')}
                    </button>
                  </th>
                  <th>Strategy</th>
                  <th className="numeric">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t: Trade) => (
                  <tr key={t.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        style={{ cursor: 'pointer' }}
                        aria-label={`Select trade ${t.symbol_name}`}
                      />
                    </td>
                    <td>
                      {t.screenshot ? (
                        <ScreenshotView src={screenshotUrl(t.screenshot)} alt="" variant="thumb" />
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/trades/${t.id}`} style={{ fontWeight: 'var(--font-medium)', color: 'inherit', textDecoration: 'none' }}>
                        {t.symbol_name}
                      </Link>
                    </td>
                    <td>{t.side}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-medium)',
                          background: t.is_paper ? 'var(--color-primary-muted)' : 'var(--color-success-muted)',
                          color: t.is_paper ? 'var(--color-primary-hover)' : 'var(--color-success)',
                        }}
                      >
                        {t.is_paper ? 'Paper' : 'Actual'}
                      </span>
                    </td>
                    <td>{formatDate(t.exit_date)}</td>
                    <td className={`numeric ${Number(t.pnl) >= 0 ? 'positive' : 'negative'}`}>
                      {formatPnl(t.pnl)}
                    </td>
                    <td>{t.strategy_name ?? '—'}</td>
                    <td className="numeric">
                      <span style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                        <button
                          type="button"
                          className="btn btn--ghost btn--icon"
                          onClick={() => {
                            duplicateMutation.mutate(t.id, {
                              onSuccess: () => {
                                queryClient.invalidateQueries({ queryKey: ['trades'] })
                              },
                            })
                          }}
                          aria-label="Duplicate"
                          title="Duplicate trade"
                        >
                          <Copy size={16} />
                        </button>
                        <Link to={`/trades/${t.id}/edit`} state={{ from: returnPath }} className="btn btn--ghost btn--icon" aria-label="Edit">
                          <Pencil size={16} />
                        </Link>
                        <button
                          type="button"
                          className="btn btn--ghost btn--icon"
                          onClick={() => setDeleteId(t.id)}
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination-wrap">
              <span>
                {count} total
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />

      <Modal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={`Delete ${selectedIds.size} trade${selectedIds.size !== 1 ? 's' : ''}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <p>This will permanently delete {selectedIds.size} trade{selectedIds.size !== 1 ? 's' : ''}. This action cannot be undone.</p>
      </Modal>

      <Modal
        open={bulkTagOpen}
        onClose={() => setBulkTagOpen(false)}
        title={`Tag ${selectedIds.size} trade${selectedIds.size !== 1 ? 's' : ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkTagOpen(false)} disabled={bulkTagMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (bulkTagIds.length > 0) {
                  bulkTagMutation.mutate({
                    ids: Array.from(selectedIds),
                    tagIds: bulkTagIds,
                    action: 'add',
                  })
                }
              }}
              disabled={bulkTagMutation.isPending || bulkTagIds.length === 0}
            >
              {bulkTagMutation.isPending ? 'Tagging…' : 'Add tags'}
            </Button>
          </>
        }
      >
        <div className="input-group">
          <label htmlFor="bulk-tag-select">Select tags</label>
          <select
            id="bulk-tag-select"
            className="select"
            multiple
            value={bulkTagIds.map(String)}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions, (o) => Number(o.value))
              setBulkTagIds(opts)
            }}
            style={{ minHeight: '120px' }}
          >
            {(tags ?? []).map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <span className="input-helper">Hold Ctrl/Cmd to select multiple tags</span>
        </div>
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            setImportFile(file)
            setImportOpen(true)
          }
        }}
      />

      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false)
          setImportFile(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }}
        title="Import Trades from CSV"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setImportOpen(false)
                setImportFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              disabled={importMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (importFile) {
                  importMutation.mutate(importFile)
                }
              }}
              disabled={importMutation.isPending || !importFile}
            >
              {importMutation.isPending ? 'Importing…' : 'Import'}
            </Button>
          </>
        }
      >
        <div className="input-group">
          <label htmlFor="import-file">CSV File</label>
          <input
            id="import-file"
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setImportFile(file)
              }
            }}
            className="input"
          />
          {importFile && (
            <p style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Selected: {importFile.name}
            </p>
          )}
          <p style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            CSV should include columns: Symbol, Side, Entry Price, Exit Price, Stop Loss, Quantity, Entry Date, Exit Date, Profit Amount, R/R, Total Capital, Amount Risked, Strategy, Tags, Notes, Emotion Rating, Emotion Notes, Pre-Trade Plan, Post-Trade Review, Paper Trade
          </p>
        </div>
      </Modal>
    </div>
  )
}
