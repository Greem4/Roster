import { NavLink, useLocation } from 'react-router-dom'
import { ROSTER_MODULES, ROSTER_MODULE_ORDER } from '../constants/rosterModules'

/** Активен ли раздел RX (лекарства, вход, регистрация). */
function isRxPath(pathname) {
  return (
    pathname === '/' ||
    pathname === '/medicines' ||
    pathname.startsWith('/medicines/')
  )
}

function isModuleActive(key, pathname) {
  if (key === 'rx') return isRxPath(pathname)
  return pathname === ROSTER_MODULES[key].path || pathname.startsWith(`${ROSTER_MODULES[key].path}/`)
}

/**
 * Слева в шапке: RosterDuty · RosterCA · RosterPay · RosterRX — переключение разделов.
 */
export default function RosterModuleNav() {
  const { pathname } = useLocation()

  return (
    <nav className="roster-nav" aria-label="Разделы Roster">
      {ROSTER_MODULE_ORDER.map((key) => {
        const mod = ROSTER_MODULES[key]
        const active = isModuleActive(key, pathname)
        return (
          <NavLink
            key={key}
            to={mod.path}
            className={['roster-nav__brand', active ? 'roster-nav__brand--active' : null]
              .filter(Boolean)
              .join(' ')}
            aria-current={active ? 'page' : undefined}
            title={mod.title}
          >
            Roster
            <span className={`roster-nav__suffix roster-nav__suffix--${key}`}>{mod.suffix}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
