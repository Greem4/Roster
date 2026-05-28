import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          RosterRx
        </Link>
        <nav className="nav">
          {hasPermission('medicines:view') && <Link to="/medicines">Лекарства</Link>}
          {hasPermission('users:manage') && <Link to="/admin/users">Пользователи</Link>}
        </nav>
        <div className="user-bar">
          <span>{user?.username}</span>
          <button type="button" className="btn-secondary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
