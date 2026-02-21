import type { TradeTemplate } from '@/types/api'
import { apiClient } from './client'

export interface TradeTemplateCreateInput {
  name: string
  symbol?: string
  side?: 'long' | 'short'
  strategy?: number | null
  tag_ids?: number[]
  notes?: string
  pre_trade_plan?: string
  is_paper?: boolean
}

export async function tradeTemplatesList(): Promise<TradeTemplate[]> {
  const { data } = await apiClient.get<TradeTemplate[]>('/trade-templates/')
  return data
}

export async function tradeTemplateGet(id: number): Promise<TradeTemplate> {
  const { data } = await apiClient.get<TradeTemplate>(`/trade-templates/${id}/`)
  return data
}

export async function tradeTemplateCreate(payload: TradeTemplateCreateInput): Promise<TradeTemplate> {
  const { data } = await apiClient.post<TradeTemplate>('/trade-templates/', payload)
  return data
}

export async function tradeTemplateUpdate(id: number, payload: Partial<TradeTemplateCreateInput>): Promise<TradeTemplate> {
  const { data } = await apiClient.patch<TradeTemplate>(`/trade-templates/${id}/`, payload)
  return data
}

export async function tradeTemplateDelete(id: number): Promise<void> {
  await apiClient.delete(`/trade-templates/${id}/`)
}
