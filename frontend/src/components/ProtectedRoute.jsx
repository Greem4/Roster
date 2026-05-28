import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="page-center">Загрузка…</div>
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <Outlet />
}

export function ActiveUserRoute() {
  const { isActive, loading } = useAuth()
  if (loading) return <div className="page-center">Загрузка…</div>
  if (!isActive) {
    return (
      <div className="card page-center">
        <h2>Доступ не выдан</h2>
        <p>Администратор ещё не активировал вашу учётную запись.</p>
      </div>
    )
  }
  return <Outlet />
}

export function PermissionRoute({ permission }) {
  const { hasPermission, loading } = useAuth()
  if (loading) return <div className="page-center">Загрузка…</div>
  if (!hasPermission(permission)) {
    return (
      <div className="card page-center">
        <h2>Нет доступа</h2>
        <p>У вас нет прав для этого раздела.</p>
      </div>
    )
  }
  return <Outlet />
}
