import type { PaginatedResponse, Symbol } from '@/types/api'
import { apiClient } from './client'

export async function symbolsList(): Promise<Symbol[]> {
  const { data } = await apiClient.get<PaginatedResponse<Symbol> | Symbol[]>('/symbols/')
  return Array.isArray(data) ? data : (data as PaginatedResponse<Symbol>).results
}

export async function symbolCreate(name: string): Promise<Symbol> {
  const { data } = await apiClient.post<Symbol>('/symbols/', { name: name.trim() })
  return data
}
