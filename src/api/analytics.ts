import type {
  AnalyticsSummary,
  EquityCurvePoint,
  DrawdownPoint,
  BySymbolItem,
  ByStrategyItem,
  ByPeriodItem,
  CalendarTrade,
  HeatmapData,
} from '@/types/api'
import { apiClient } from './client'

export type PeriodType = 'day' | 'week' | 'month'

export interface AnalyticsParams {
  from?: string
  to?: string
  is_paper?: boolean
}

export async function analyticsSummary(params: AnalyticsParams = {}): Promise<AnalyticsSummary> {
  const search = new URLSearchParams()
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.is_paper !== undefined) search.set('is_paper', String(params.is_paper))
  const q = search.toString()
  const url = q ? `/analytics/summary/?${q}` : '/analytics/summary/'
  const { data } = await apiClient.get<AnalyticsSummary>(url)
  return data
}

export async function analyticsEquityCurve(params: AnalyticsParams = {}): Promise<{ data: EquityCurvePoint[] }> {
  const search = new URLSearchParams()
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.is_paper !== undefined) search.set('is_paper', String(params.is_paper))
  const q = search.toString()
  const url = q ? `/analytics/equity-curve/?${q}` : '/analytics/equity-curve/'
  const { data } = await apiClient.get<{ data: EquityCurvePoint[] }>(url)
  return data
}

export async function analyticsDrawdown(params: AnalyticsParams = {}): Promise<{ data: DrawdownPoint[] }> {
  const search = new URLSearchParams()
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.is_paper !== undefined) search.set('is_paper', String(params.is_paper))
  const q = search.toString()
  const url = q ? `/analytics/drawdown/?${q}` : '/analytics/drawdown/'
  const { data } = await apiClient.get<{ data: DrawdownPoint[] }>(url)
  return data
}

export async function analyticsBySymbol(params: AnalyticsParams = {}): Promise<{ data: BySymbolItem[] }> {
  const search = new URLSearchParams()
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.is_paper !== undefined) search.set('is_paper', String(params.is_paper))
  const q = search.toString()
  const url = q ? `/analytics/by-symbol/?${q}` : '/analytics/by-symbol/'
  const { data } = await apiClient.get<{ data: BySymbolItem[] }>(url)
  return data
}

export async function analyticsByStrategy(params: AnalyticsParams = {}): Promise<{ data: ByStrategyItem[] }> {
  const search = new URLSearchParams()
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.is_paper !== undefined) search.set('is_paper', String(params.is_paper))
  const q = search.toString()
  const url = q ? `/analytics/by-strategy/?${q}` : '/analytics/by-strategy/'
  const { data } = await apiClient.get<{ data: ByStrategyItem[] }>(url)
  return data
}

export async function analyticsByPeriod(
  period: PeriodType,
  params: AnalyticsParams = {}
): Promise<{ data: ByPeriodItem[] }> {
  const search = new URLSearchParams()
  search.set('period', period)
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.is_paper !== undefined) search.set('is_paper', String(params.is_paper))
  const url = `/analytics/by-period/?${search.toString()}`
  const { data } = await apiClient.get<{ data: ByPeriodItem[] }>(url)
  return data
}

export async function analyticsCalendar(year: number, month: number): Promise<{ data: CalendarTrade[]; year: number; month: number }> {
  const { data } = await apiClient.get<{ data: CalendarTrade[]; year: number; month: number }>(
    `/analytics/calendar/?year=${year}&month=${month}`
  )
  return data
}

export async function analyticsHeatmap(): Promise<{ data: HeatmapData[] }> {
  const { data } = await apiClient.get<{ data: HeatmapData[] }>('/analytics/heatmap/')
  return data
}

export async function generatePDFReport(from?: string, to?: string): Promise<Blob> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const url = `/analytics/pdf-report/${params.toString() ? `?${params.toString()}` : ''}`
  const { data } = await apiClient.get<Blob>(url, { responseType: 'blob' })
  return data
}
