import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROSTER_MODULES, ROSTER_MODULE_ORDER } from '../constants/rosterModules'

const RX_HOME = ROSTER_MODULES.rx.path

/** Активен ли раздел RX (лекарства, вход, регистрация). */
function isRxPath(pathname) {
  return (
    pathname === '/' ||
    pathname === RX_HOME ||
    pathname.startsWith(`${RX_HOME}/`) ||
    pathname === '/medicines' ||
    pathname.startsWith('/medicines/')
  )
}

function isModuleActive(key, pathname) {
  if (key === 'rx') return isRxPath(pathname)
  return pathname === ROSTER_MODULES[key].path || pathname.startsWith(`${ROSTER_MODULES[key].path}/`)
}

/** Ключ текущего раздела по маршруту. */
function activeModuleKey(pathname) {
  return ROSTER_MODULE_ORDER.find((key) => isModuleActive(key, pathname)) ?? 'rx'
}

function ModuleBrand({ moduleKey }) {
  const mod = ROSTER_MODULES[moduleKey]
  return (
    <>
      Roster
      <span className={`roster-nav__suffix roster-nav__suffix--${moduleKey}`}>{mod.suffix}</span>
    </>
  )
}

/**
 * На узком экране — выбор модуля в панели страницы (в один ряд с сортировкой и фильтрами).
 */
export function RosterModulePicker() {
  const { pathname } = useLocation()
  const { canAccessModule } = useAuth()
  const visibleModules = ROSTER_MODULE_ORDER.filter((key) => canAccessModule(key))
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuId = useId()
  const currentKey = activeModuleKey(pathname)
  const currentMod = ROSTER_MODULES[currentKey]

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    close()
  }, [pathname, close])

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

  return (
    <div
      ref={rootRef}
      className={['roster-nav roster-nav--mobile', open ? 'roster-nav--open' : null]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className={['roster-nav__trigger', 'roster-nav__brand', 'roster-nav__brand--active']
          .filter(Boolean)
          .join(' ')}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`Раздел: ${currentMod.title}. Выбрать другой модуль`}
        title={currentMod.title}
      >
        <ModuleBrand moduleKey={currentKey} />
        <span className="roster-nav__chevron" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          className="roster-nav__dropdown"
          role="menu"
          aria-label="Разделы Roster"
        >
          {visibleModules.map((key) => {
            const mod = ROSTER_MODULES[key]
            const active = isModuleActive(key, pathname)
            return (
              <NavLink
                key={key}
                to={mod.path}
                className={['roster-nav__dropdown-item', active ? 'roster-nav__dropdown-item--active' : null]
                  .filter(Boolean)
                  .join(' ')}
                role="menuitem"
                aria-current={active ? 'page' : undefined}
                title={mod.title}
                onClick={close}
              >
                <ModuleBrand moduleKey={key} />
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Слева в шапке (десктоп): RosterDuty · RosterCA · RosterPay · RosterRX.
 */
export default function RosterModuleNav() {
  const { pathname } = useLocation()
  const { canAccessModule } = useAuth()
  const visibleModules = ROSTER_MODULE_ORDER.filter((key) => canAccessModule(key))

  return (
    <nav className="roster-nav roster-nav--desktop" aria-label="Разделы Roster">
      {visibleModules.map((key) => {
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
            <ModuleBrand moduleKey={key} />
          </NavLink>
        )
      })}
    </nav>
  )
}
