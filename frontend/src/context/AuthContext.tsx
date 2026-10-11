import React, { useState, useEffect, useCallback } from 'react'
import type { User, Role } from '../types/auth'
import { API_BASE_URL } from '../config/api'
import { AuthContext, type AuthContextValue } from './authContextDef'

/**
 * Storage Security Note:
 * Bearer tokens are stored in browser localStorage to allow session persistence across page reloads.
 * Trade-off: localStorage is accessible to JavaScript on the same origin (mitigated by strict
 * CSP/security headers, no external tracking scripts, and clearing token on logout/expiration).
 */
const TOKEN_STORAGE_KEY = 'prachay_token'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)))

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Restore and validate session on initial application load
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!savedToken) return

    let isMounted = true

    fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${savedToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid session')
        return res.json()
      })
      .then((data) => {
        if (isMounted) {
          setUser(data.user)
          setToken(savedToken)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          logout()
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [logout])

  const login = async (email: string, password: string): Promise<User> => {
    let response: Response

    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      throw new Error(
        'Unable to connect to the authentication server. Please check your network or ensure the server is running.'
      )
    }

    let data: { token?: string; user?: User; message?: string; error?: string }
    try {
      data = await response.json()
    } catch {
      throw new Error(`Server returned an unexpected response (Status ${response.status}).`)
    }

    if (!response.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        (response.status === 401
          ? 'Invalid email or password.'
          : `Authentication failed (Status ${response.status}).`)
      throw new Error(errorMessage)
    }

    if (!data.token || !data.user) {
      throw new Error('Malformed authentication response received from server.')
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const hasRole = (role: Role | Role[]): boolean => {
    if (!user) return false
    const allowed = Array.isArray(role) ? role : [role]
    return allowed.includes(user.role)
  }

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    hasRole,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
