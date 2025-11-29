import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { API_BASE_URL } from '../config';


export type Role =
  | 'ADMIN'
  | 'SCHOOL'
  | 'SCHOOL_ADMIN'
  | 'STUDENT'
  | 'TEACHER'
  | 'KITCHEN'
  | 'UNKNOWN'

export interface UserProfile {
  user_id: number
  school_id: number | null
  email: string
  username: string
  role_name: string
  full_name: string
  first_name: string
  birth_date: string | null
  school_name: string | null
}

interface AuthState {
  token: string | null
  user: UserProfile | null
  role: Role
}

interface AuthContextValue extends AuthState {
  login: (usernameOrEmail: string, password: string) => Promise<void>
  logout: () => void
}

interface LoginResponse {
  token: string
  user: UserProfile
}

const AUTH_KEY = 'authData'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function decodeRole(token: string): Role {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return (decoded.role as Role) || 'UNKNOWN'
  } catch (error) {
    console.error('Could not decode token', error)
    return 'UNKNOWN'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null, role: 'UNKNOWN' })

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    if (stored) {
      try {
        const parsed: AuthState = JSON.parse(stored)
        setState(parsed)
      } catch (error) {
        console.error('Invalid auth state in storage', error)
      }
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    async function login(usernameOrEmail: string, password: string) {
      const payload = { usernameOrEmail, password }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('network_error')
        }

        const data = (await response.json()) as LoginResponse | { message?: string }
        if ('message' in data && data.message === 'wrong_credentials') {
          throw new Error('wrong_credentials')
        }

        if (!('token' in data)) {
          throw new Error('invalid_response')
        }

        const role = decodeRole(data.token)
        const nextState: AuthState = { token: data.token, user: data.user, role }
        setState(nextState)
        localStorage.setItem(AUTH_KEY, JSON.stringify(nextState))
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          throw new Error('service_unavailable')
        }
        throw error
      } finally {
        clearTimeout(timeout)
      }
    }

    function logout() {
      setState({ token: null, user: null, role: 'UNKNOWN' })
      localStorage.removeItem(AUTH_KEY)
    }

    return { ...state, login, logout }
  }, [state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
