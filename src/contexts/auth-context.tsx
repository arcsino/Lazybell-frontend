'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi, usersApi } from '@/lib/api/auth'
import { setAccessToken } from '@/lib/api'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const u = await usersApi.me()
      setUser(u)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { access } = await authApi.refresh()
        setAccessToken(access)
        const u = await usersApi.me()
        setUser(u)
      } catch {
        setAccessToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { access, user: u } = await authApi.login({ username, password })
    setAccessToken(access)
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch { /* ignore */ }
    setAccessToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
