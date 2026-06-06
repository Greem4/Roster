import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setToken } from '../api/client'
import { canAccessModule as checkModuleAccess } from '../constants/moduleAccess'
import { setCachedYandexAvatar } from '../utils/yandexAvatar'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await api.me()
      setUser(me)
      if (me.avatar_url) {
        setCachedYandexAvatar(me.avatar_url)
      }
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (username, password) => {
    const { access_token } = await api.login(username, password)
    setToken(access_token)
    await refresh()
  }

  const loginWithToken = async (accessToken) => {
    setToken(accessToken)
    await refresh()
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const hasPermission = (code) => {
    if (!user) return false
    if (user.is_founder || user.is_superadmin) return true
    return user.permissions.includes(code)
  }

  const canAccessModule = useCallback(
    (moduleKey) =>
      checkModuleAccess(moduleKey, {
        user,
        isAuthenticated: !!user,
        hasPermission,
      }),
    [user],
  )

  const isFounder = !!user?.is_founder
  const isSuperadmin = !!user?.is_superadmin && !user?.is_founder
  const isAdmin =
    !!user &&
    (user.is_founder || user.is_superadmin || user.permissions.includes('users:manage'))
  const canManageUsers = isAdmin

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      loginWithToken,
      logout,
      refresh,
      hasPermission,
      canAccessModule,
      isFounder,
      isSuperadmin,
      isAdmin,
      canManageUsers,
      isAuthenticated: !!user,
      isActive: user?.is_active || user?.is_superadmin || user?.is_founder,
    }),
    [user, loading, refresh, isAdmin, canManageUsers, isFounder, isSuperadmin, canAccessModule],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
