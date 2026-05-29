import { Navigate, Outlet, useLocation } from 'react-router-dom'
import RouteModal from './RouteModal'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <Outlet />
}

export function ActiveUserRoute() {
  const { isActive, loading } = useAuth()
  if (loading) return null
  if (!isActive) {
    return (
      <RouteModal title="Доступ не выдан">
        <p>Администратор ещё не активировал вашу учётную запись.</p>
      </RouteModal>
    )
  }
  return <Outlet />
}

export function PermissionRoute({ permission }) {
  const { hasPermission, loading } = useAuth()
  if (loading) return null
  if (!hasPermission(permission)) {
    return (
      <RouteModal title="Нет доступа">
        <p>У вас нет прав для этого раздела.</p>
      </RouteModal>
    )
  }
  return <Outlet />
}
