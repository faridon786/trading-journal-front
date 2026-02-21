import type { LoginResponse, RegisterResponse, User } from '@/types/api'
import { apiClient } from './client'

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login/', { username, password })
  return data
}

export async function register(params: {
  username: string
  email?: string
  password: string
  first_name?: string
  last_name?: string
}): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register/', params)
  return data
}

export async function me(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me/')
  return data
}
