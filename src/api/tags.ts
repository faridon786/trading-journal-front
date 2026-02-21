import type { PaginatedResponse, Tag } from '@/types/api'
import { apiClient } from './client'

export async function tagsList(): Promise<Tag[]> {
  const { data } = await apiClient.get<PaginatedResponse<Tag> | Tag[]>('/tags/')
  return Array.isArray(data) ? data : (data as PaginatedResponse<Tag>).results
}

export async function tagCreate(name: string): Promise<Tag> {
  const { data } = await apiClient.post<Tag>('/tags/', { name })
  return data
}

export async function tagUpdate(id: number, name: string): Promise<Tag> {
  const { data } = await apiClient.patch<Tag>(`/tags/${id}/`, { name })
  return data
}

export async function tagDelete(id: number): Promise<void> {
  await apiClient.delete(`/tags/${id}/`)
}
