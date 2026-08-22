import { createContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthContextValue = {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  )