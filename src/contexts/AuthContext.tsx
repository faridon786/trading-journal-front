/* eslint-disable react-refresh/only-export-components */
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { User } from '@/types/api'
import * as authApi from '@/api/auth'
import { clearTokens, getRefreshToken, setTokens } from '@/api/client'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (params: {
    username: string
    email?: string
    password: string
    first_name?: string
    last_name?: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const refresh = getRefreshToken()
    if (!refresh) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const u = await authApi.me()
      setUser(u)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await authApi.login(username, password)
      setTokens(res.access, res.refresh)
      const u = await authApi.me()
      setUser(u)
    },
    []
  )

  const register = useCallback(
    async (params: {
      username: string
      email?: string
      password: string
      first_name?: string
      last_name?: string
    }) => {
      const res = await authApi.register(params)
      setTokens(res.access, res.refresh)
      setUser(res.user)
    },
    []
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
