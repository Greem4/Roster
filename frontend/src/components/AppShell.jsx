import { Outlet } from 'react-router-dom'
import RosterModuleNav from './RosterModuleNav'
import UserMenuButton from './UserMenuButton'

/**
 * Оболочка: слева RosterDuty · RosterCA · RosterPay · RosterRX, справа профиль.
 */
export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__start">
          <RosterModuleNav />
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
