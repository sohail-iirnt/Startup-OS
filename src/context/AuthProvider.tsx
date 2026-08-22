import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

import { auth } from '../lib/firebase'
import { createUserProfile } from '../services/userService'
import { initializeDefaultWorkspace } from '../services/workspaceService'
import {
  AuthContext,
  type AuthContextValue,
} from './AuthContext'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (firebaseUser) => {
          setUser(firebaseUser)
          setLoading(false)

          if (firebaseUser) {
            void initializeUserData(
              firebaseUser,
            )
          }
        },
      )

    return unsubscribe
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: Boolean(user),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

async function initializeUserData(
  firebaseUser: User,
): Promise<void> {
  try {
    await createUserProfile(
      firebaseUser,
    )

    await initializeDefaultWorkspace(
      firebaseUser.uid,
      firebaseUser,
    )
  } catch (error) {
    console.error(
      'Failed to initialize user data:',
      error,
    )
  }
}