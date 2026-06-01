import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/auth/proxy/firebase'
import type { AuthUser } from '@/auth/domain'
import { GITHUB_TOKEN_KEY } from '@/auth/constants'

export function persistGithubToken(token: string): void {
  localStorage.setItem(GITHUB_TOKEN_KEY, token)
}

export function clearGithubToken(): void {
  localStorage.removeItem(GITHUB_TOKEN_KEY)
}

function readGithubToken(): string {
  return localStorage.getItem(GITHUB_TOKEN_KEY) ?? ''
}

interface AuthContextValue {
  user: AuthUser | null
  authLoading: boolean
  setGithubToken: (token: string) => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authLoading: true,
  setGithubToken: () => {},
})

function userFromFirebase(firebaseUser: User): AuthUser {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    githubToken: readGithubToken(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    auth?.currentUser ? userFromFirebase(auth.currentUser) : null
  )
  const [authLoading, setAuthLoading] = useState(() => !auth?.currentUser)

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser(userFromFirebase(firebaseUser))
      } else {
        clearGithubToken()
        setUser(null)
      }
      setAuthLoading(false)
    })

    return unsubscribe
  }, [])

  function setGithubToken(token: string) {
    persistGithubToken(token)
    setUser((prev) => (prev ? { ...prev, githubToken: token } : null))
  }

  return (
    <AuthContext.Provider value={{ user, authLoading, setGithubToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
