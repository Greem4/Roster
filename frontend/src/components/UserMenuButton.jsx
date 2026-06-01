import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function profileInitial(username) {
  const s = (username || '').trim()
  return s ? s.charAt(0).toLocaleUpperCase('ru') : '?'
}

/**
 * Профиль в шапке: по клику на аватар — меню «Кабинет», «Настройки», «Выйти».
 * Общий для всех модулей Roster (Duty · Pay · RX).
 */
export default function UserMenuButton() {
  const { user, isAuthenticated, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuId = useId()
  const navigate = useNavigate()
  const location = useLocation()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    close()
  }, [location.pathname, close])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        close()
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

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
  const onCabinet = location.pathname.startsWith('/cabinet')
  const profileLabel = user?.username ? `Профиль: ${user.username}` : 'Меню профиля'

  const handleLogout = () => {
    close()
    logout()
    navigate('/medicines')
  }

  return (
    <div
      ref={rootRef}
      className={['user-menu', 'user-menu--profile', open ? 'user-menu--open' : null]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className={[
          'user-menu__profile',
          onCabinet ? 'user-menu__profile--active' : null,
          open ? 'user-menu__profile--open' : null,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        title={profileLabel}
        aria-label={profileLabel}
      >
        {user?.avatar_url ? (
          <img className="user-menu__avatar" src={user.avatar_url} alt="" width={36} height={36} />
        ) : (
          <span className="user-menu__avatar user-menu__avatar--initial" aria-hidden="true">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          className="user-menu__dropdown"
          role="menu"
          aria-label="Меню профиля"
        >
          <NavLink
            to="/cabinet"
            end
            className={({ isActive }) =>
              ['user-menu__item', isActive ? 'user-menu__item--active' : null]
                .filter(Boolean)
                .join(' ')
            }
            role="menuitem"
            onClick={close}
          >
            Личный кабинет
          </NavLink>
          <NavLink
            to="/cabinet/settings"
            className={({ isActive }) =>
              ['user-menu__item', isActive ? 'user-menu__item--active' : null]
                .filter(Boolean)
                .join(' ')
            }
            role="menuitem"
            onClick={close}
          >
            Настройки
          </NavLink>
          <button type="button" className="user-menu__item user-menu__item--logout" role="menuitem" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      )}
    </div>
  )
}
