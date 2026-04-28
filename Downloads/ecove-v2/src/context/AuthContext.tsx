'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import axios, { AxiosError } from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWishlist } from '@/hooks/useCart'

interface VendorInfo {
  id: string; businessName: string; slug: string
  status: string; availableBalance: number; averageRating: number
}
interface User {
  id: string; firstName: string; lastName: string
  email: string; role: string; avatarUrl?: string
  isEmailVerified?: boolean
  vendor?: VendorInfo
}
interface AuthCtx {
  user:         User | null
  loading:      boolean
  login:        (email: string, password: string) => Promise<void>
  logout:       () => Promise<void>
  refresh:      () => Promise<void>  // re-fetch /api/auth/me (kept for backward compat)
  fetchUser:    () => Promise<void>  // alias for refresh — clearer name
  refreshToken: () => Promise<void>  // actually renews the JWT via /api/auth/refresh
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

// ── Axios 401 interceptor ────────────────────────────────────────────────────
// Silently renew the JWT when any request gets a 401, then replay the original.
// Set up once outside the component so it's registered for the app's lifetime.
let _pendingRefresh: Promise<void> | null = null
let _interceptorRegistered = false

function setupAxiosInterceptor(onRefreshFailed: () => void) {
  if (_interceptorRegistered) return
  _interceptorRegistered = true

  axios.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
      const original = error.config as any
      // Only intercept 401s that haven't already been retried,
      // and skip the refresh/logout endpoints themselves.
      if (
        error.response?.status === 401 &&
        !original._retry &&
        !original.url?.includes('/api/auth/refresh') &&
        !original.url?.includes('/api/auth/logout')
      ) {
        original._retry = true
        try {
          // Deduplicate: if many requests 401 at once, only one refresh fires
          if (!_pendingRefresh) {
            _pendingRefresh = axios.post('/api/auth/refresh').finally(() => {
              _pendingRefresh = null
            })
          }
          await _pendingRefresh
          return axios(original)
        } catch {
          // Refresh itself failed — user's session is truly expired
          onRefreshFailed()
        }
      }
      return Promise.reject(error)
    }
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const syncWishlist = useWishlist(s => s.syncToServer)

  // Register the interceptor once; give it a callback to clear user on hard logout
  const onRefreshFailed = useCallback(() => {
    setUser(null)
  }, [])
  useEffect(() => { setupAxiosInterceptor(onRefreshFailed) }, [onRefreshFailed])

  // FIX: fetchUser re-fetches the current user profile from /api/auth/me
  const fetchUser = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/auth/me')
      setUser(data.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // FIX: refreshToken actually calls /api/auth/refresh to issue a new JWT
  const refreshToken = useCallback(async () => {
    try {
      await axios.post('/api/auth/refresh')
      await fetchUser()
    } catch {
      setUser(null)
      setLoading(false)
    }
  }, [fetchUser])

  // Keep `refresh` as an alias for backward compatibility with any component
  // that already calls useAuth().refresh()
  const refresh = fetchUser

  useEffect(() => { fetchUser() }, [fetchUser])

  const login = async (email: string, password: string) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    setUser(data.data.user)

    // FIX: migrate guest wishlist to the server after login
    syncWishlist().catch(() => {})

    const role = data.data.user.role

    if (role === 'super_admin' || role === 'admin') {
      router.push('/admin')
    } else if (role === 'vendor') {
      router.push('/vendor/dashboard')
    } else {
      // FIX: honour ?next= redirect param — only allow relative paths to prevent
      // open redirect attacks. Fall back to home if next is missing or external.
      const next = searchParams?.get('next')
      const destination = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
      router.push(destination)
    }
  }

  const logout = async () => {
    await axios.post('/api/auth/logout').catch(() => {})
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, fetchUser, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
