import { NavLink, Outlet } from 'react-router-dom'

/**
 * Оболочка раздела «График ОСМП» в кабинете: подменю и вложенные страницы.
 */
export default function DutyStaffLayout() {
  return (
    <div className="duty-staff-layout">
      <nav className="duty-staff-subnav" aria-label="График ОСМП">
        <NavLink to="/cabinet/duty-staff" end className="duty-staff-subnav__link">
          Справочник
        </NavLink>
        <NavLink to="/cabinet/duty-staff/new" className="duty-staff-subnav__link">
          Новый сотрудник
        </NavLink>
        <NavLink
          to="/cabinet/duty-staff/remove"
          className="duty-staff-subnav__link duty-staff-subnav__link--muted"
        >
          Исключить…
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
