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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser)
        setLoading(false)

        if (firebaseUser) {
          void initializeUserData(firebaseUser)
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

async function initializeUserData(firebaseUser: User): Promise<void> {
  try {
    // Authentication creates the identity profile only.
    // Workspace membership is intentionally NOT auto-created here.
    // Existing members keep their default workspace; new registrations
    // must explicitly request access to a workspace using its Workspace ID.
    await createUserProfile(firebaseUser)
  } catch (error) {
    console.error('Failed to initialize user profile:', error)
  }
}
