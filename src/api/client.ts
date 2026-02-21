import axios, { type AxiosError } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const ACCESS_KEY = 'trading_journal_access'
const REFRESH_KEY = 'trading_journal_refresh'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
const refreshSubscribers: Array<(token: string) => void> = []

function onRefreshed(token: string): void {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers.length = 0
}

function addRefreshSubscriber(cb: (token: string) => void): void {
  refreshSubscribers.push(cb)
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Let the browser set Content-Type (with boundary) for FormData; default application/json breaks multipart
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as { _retry?: boolean } & NonNullable<AxiosError['config']>

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refresh = getRefreshToken()
      if (!refresh) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest!))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post<{ access: string }>(`${BASE_URL}/auth/refresh/`, {
          refresh,
        })
        setTokens(data.access, refresh)
        onRefreshed(data.access)
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${data.access}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
