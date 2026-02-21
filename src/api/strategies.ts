import type { PaginatedResponse, Strategy } from '@/types/api'
import { apiClient } from './client'

export async function strategiesList(): Promise<Strategy[]> {
  const { data } = await apiClient.get<PaginatedResponse<Strategy> | Strategy[]>('/strategies/')
  return Array.isArray(data) ? data : (data as PaginatedResponse<Strategy>).results
}

export async function strategyCreate(name: string): Promise<Strategy> {
  const { data } = await apiClient.post<Strategy>('/strategies/', { name })
  return data
}

export async function strategyUpdate(id: number, name: string): Promise<Strategy> {
  const { data } = await apiClient.patch<Strategy>(`/strategies/${id}/`, { name })
  return data
}

export async function strategyDelete(id: number): Promise<void> {
  await apiClient.delete(`/strategies/${id}/`)
}
