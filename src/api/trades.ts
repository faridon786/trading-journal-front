import type { PaginatedResponse, Trade, TradeCreateInput } from '@/types/api'
import { apiClient } from './client'

export interface TradesListParams {
  page?: number
  from?: string
  to?: string
  symbol?: number
  strategy?: number
  is_paper?: boolean
  search?: string
  ordering?: string
}

export async function tradesList(params: TradesListParams = {}): Promise<PaginatedResponse<Trade>> {
  const search = new URLSearchParams()
  if (params.page != null) search.set('page', String(params.page))
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.symbol != null) search.set('symbol', String(params.symbol))
  if (params.strategy != null) search.set('strategy', String(params.strategy))
  if (params.is_paper !== undefined) search.set('is_paper', String(params.is_paper))
  if (params.search) search.set('search', params.search)
  if (params.ordering) search.set('ordering', params.ordering)
  const q = search.toString()
  const url = q ? `/trades/?${q}` : '/trades/'
  const { data } = await apiClient.get<PaginatedResponse<Trade>>(url)
  return data
}

export async function tradeGet(id: number): Promise<Trade> {
  const { data } = await apiClient.get<Trade>(`/trades/${id}/`)
  return data
}

function buildFormData(body: Record<string, unknown>, screenshot: File): FormData {
  const form = new FormData()
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue
    if (k === 'tag_ids' && Array.isArray(v)) {
      v.forEach((id) => form.append('tag_ids', String(id)))
    } else if (v !== null) {
      form.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
    }
  }
  form.append('screenshot', screenshot)
  return form
}

export async function tradeCreate(payload: TradeCreateInput, screenshot?: File | null): Promise<Trade> {
  const symbolId = Number(payload.symbol)
  if (!Number.isInteger(symbolId) || symbolId < 1) {
    throw new Error('Please select a symbol.')
  }
  const body: Record<string, unknown> = {
    ...payload,
    symbol: symbolId,
    entry_price: String(payload.entry_price),
    exit_price: String(payload.exit_price),
    pnl: String(payload.pnl),
  }
  if (payload.stop_loss != null && payload.stop_loss !== '') body.stop_loss = String(payload.stop_loss)
  if (payload.quantity != null && payload.quantity !== '') body.quantity = String(payload.quantity)
  if (payload.rr != null && payload.rr !== '') body.rr = String(payload.rr)
  if (payload.total_capital != null && payload.total_capital !== '') body.total_capital = String(payload.total_capital)
  if (payload.amount_risked != null && payload.amount_risked !== '') body.amount_risked = String(payload.amount_risked)
  if (screenshot) {
    const form = buildFormData(body as Record<string, unknown>, screenshot)
    const { data } = await apiClient.post<Trade>('/trades/', form)
    return data
  }
  const { data } = await apiClient.post<Trade>('/trades/', body)
  return data
}

export async function tradeUpdate(id: number, payload: Partial<TradeCreateInput>, screenshot?: File | null): Promise<Trade> {
  const body: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) continue
    if (k === 'entry_price' || k === 'exit_price' || k === 'stop_loss' || k === 'quantity' || k === 'pnl' || k === 'rr') {
      if (v != null && v !== '') body[k] = String(v)
    } else if (k === 'symbol' && (typeof v !== 'number' || v < 1)) {
      continue
    } else if (k === 'leverage' && (typeof v !== 'number' || v <= 0)) {
      body[k] = 1
    } else if ((k === 'total_capital' || k === 'amount_risked') && v != null && v !== '') {
      body[k] = String(v)
    } else if (k === 'emotion_rating' && (v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v)))) {
      continue
    } else {
      body[k] = v
    }
  }
  if (screenshot) {
    const form = buildFormData(body, screenshot)
    const { data } = await apiClient.patch<Trade>(`/trades/${id}/`, form)
    return data
  }
  const { data } = await apiClient.patch<Trade>(`/trades/${id}/`, body)
  return data
}

export async function tradeDelete(id: number): Promise<void> {
  await apiClient.delete(`/trades/${id}/`)
}

export async function bulkDeleteTrades(ids: number[]): Promise<{ deleted: number }> {
  const { data } = await apiClient.post<{ deleted: number }>('/trades/bulk-delete/', { ids })
  return data
}

export async function bulkTagTrades(ids: number[], tagIds: number[], action: 'add' | 'remove' = 'add'): Promise<{ updated: number }> {
  const { data } = await apiClient.post<{ updated: number }>('/trades/bulk-tag/', { ids, tag_ids: tagIds, action })
  return data
}

export async function duplicateTrade(id: number): Promise<Trade> {
  const { data } = await apiClient.post<Trade>(`/trades/${id}/duplicate/`)
  return data
}

export async function exportTradesCSV(params: Omit<TradesListParams, 'page'> = {}): Promise<Blob> {
  const search = new URLSearchParams()
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.symbol != null) search.set('symbol', String(params.symbol))
  if (params.strategy != null) search.set('strategy', String(params.strategy))
  if (params.is_paper !== undefined) search.set('is_paper', String(params.is_paper))
  const q = search.toString()
  const url = q ? `/trades/export/?${q}` : '/trades/export/'
  const { data } = await apiClient.get<Blob>(url, { responseType: 'blob' })
  return data
}

export async function importTradesCSV(file: File): Promise<{ created: number; errors: string[]; total_errors: number }> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<{ created: number; errors: string[]; total_errors: number }>(
    '/trades/import/',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function compareTrades(ids: number[]): Promise<{ trades: Trade[] }> {
  const idsParam = ids.join(',')
  const { data } = await apiClient.get<{ trades: Trade[] }>(`/trades/compare/?ids=${idsParam}`)
  return data
}
