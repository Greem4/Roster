import { NavLink } from 'react-router-dom'

/**
 * Переключатель разделов RosterPay: счета и аналитика.
 */
export default function PayNav() {
  return (
    <nav className="pay-nav" aria-label="Разделы RosterPay">
      <NavLink
        to="/pay"
        end
        className={({ isActive }) => `pay-nav__link${isActive ? ' pay-nav__link--active' : ''}`}
      >
        Счета
      </NavLink>
      <NavLink
        to="/pay/analytics"
        className={({ isActive }) => `pay-nav__link${isActive ? ' pay-nav__link--active' : ''}`}
      >
        Аналитика
      </NavLink>
    </nav>
  )
}
