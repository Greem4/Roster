import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import RoleBadge from './cabinet/RoleBadge'
import { useAuth } from '../context/AuthContext'

export default function AppShell() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/medicines')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/medicines" className="brand">
          RosterRx
        </Link>
        <nav className="nav">
          <Link to="/medicines">Лекарства</Link>
          {isAuthenticated && (
            <NavLink
              to="/cabinet"
              className={({ isActive }) => (isActive ? 'nav-link--active' : undefined)}
            >
              Личный кабинет
            </NavLink>
          )}
        </nav>
        <div className="user-bar">
          {isAuthenticated ? (
            <>
              {user?.avatar_url && (
                <img
                  className="user-bar__avatar"
                  src={user.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                />
              )}
              <span className="user-bar__name">{user?.username}</span>
              <RoleBadge role={user?.role} />
              <button type="button" className="btn-secondary" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary link-btn">
                Войти
              </Link>
              <Link to="/register" className="btn-primary link-btn">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
