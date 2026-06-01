import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function profileInitial(username) {
  const s = (username || '').trim()
  return s ? s.charAt(0).toLocaleUpperCase('ru') : '?'
}

/**
 * Компактный вход в кабинет: только аватар (или буква), без имени и роли в шапке.
 */
export default function UserMenuButton() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="user-menu">
        <Link to="/login" className="user-menu__auth user-menu__auth--ghost">
          Войти
        </Link>
        <Link to="/register" className="user-menu__auth user-menu__auth--accent">
          Регистрация
        </Link>
      </div>
    )
  }

  const initial = profileInitial(user?.username)

  return (
    <NavLink
      to="/cabinet"
      className={({ isActive }) =>
        ['user-menu__profile', isActive ? 'user-menu__profile--active' : null]
          .filter(Boolean)
          .join(' ')
      }
      title={user?.username ? `Профиль: ${user.username}` : 'Личный кабинет'}
      aria-label={user?.username ? `Профиль: ${user.username}` : 'Личный кабинет'}
    >
      {user?.avatar_url ? (
        <img className="user-menu__avatar" src={user.avatar_url} alt="" width={36} height={36} />
      ) : (
        <span className="user-menu__avatar user-menu__avatar--initial" aria-hidden="true">
          {initial}
        </span>
      )}
    </NavLink>
  )
}
