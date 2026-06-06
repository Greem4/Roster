import { Navigate, Route, Routes } from 'react-router-dom'
import { ActiveUserRoute, PermissionRoute, ProtectedRoute } from '../../components/ProtectedRoute'
import { PERM_DUTY_VIEW } from './constants'
import DutyPage from './pages/DutyPage'

/**
 * Маршруты RosterDuty. Изолированы от CA, Pay и RX.
 * Общий график — только для активных пользователей с правом duty:view.
 */
export default function DutyRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<ActiveUserRoute />}>
          <Route element={<PermissionRoute permission={PERM_DUTY_VIEW} />}>
            <Route index element={<DutyPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/duty" replace />} />
    </Routes>
  )
}
