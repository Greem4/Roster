import { Outlet } from 'react-router-dom'
import RosterModuleNav, { RosterModulePicker } from './RosterModuleNav'
import UserMenuButton from './UserMenuButton'

/**
 * Оболочка: слева модули Roster, справа профиль.
 * На мобилке переключатель — в шапке, в один ряд с аватаром.
 */
export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__start">
          <RosterModuleNav />
          <RosterModulePicker />
        </div>
        <div className="app-header__user">
          <UserMenuButton />
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
