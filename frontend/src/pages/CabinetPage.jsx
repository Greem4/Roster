import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminUsersPanel from '../panels/AdminUsersPanel'
import CabinetOverviewPanel from '../panels/CabinetOverviewPanel'
import CabinetSettingsPanel from '../panels/CabinetSettingsPanel'

/**
 * Личный кабинет — отдельная страница с разделами: обзор, пользователи, настройки.
 */
export default function CabinetPage() {
  const { canManageUsers } = useAuth()

  return (
    <div className="cabinet-page">
      <header className="cabinet-page__header">
        <h1 className="cabinet-page__title">Личный кабинет</h1>
      </header>

      <nav className="cabinet-nav" aria-label="Разделы кабинета">
        <NavLink to="/cabinet" end className="cabinet-nav__link">
          Обзор
        </NavLink>
        {canManageUsers && (
          <NavLink to="/cabinet/users" className="cabinet-nav__link">
            Пользователи
          </NavLink>
        )}
        <NavLink to="/cabinet/settings" className="cabinet-nav__link">
          Настройки
        </NavLink>
      </nav>

      <div className="cabinet-page__content">
        <Routes>
          <Route index element={<CabinetOverviewPanel />} />
          <Route
            path="users"
            element={
              canManageUsers ? <AdminUsersPanel /> : <Navigate to="/cabinet" replace />
            }
          />
          <Route path="settings" element={<CabinetSettingsPanel />} />
          <Route path="*" element={<Navigate to="/cabinet" replace />} />
        </Routes>
      </div>
    </div>
  )
}
