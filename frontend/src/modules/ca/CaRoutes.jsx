import { Navigate, Route, Routes } from 'react-router-dom'
import { ActiveUserRoute, PermissionRoute, ProtectedRoute } from '../../components/ProtectedRoute'
import { PERM_CA_VIEW } from './constants'
import CaPage from './pages/CaPage'

/**
 * Маршруты RosterCA. Изолированы от Pay и RX.
 */
export default function CaRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<ActiveUserRoute />}>
          <Route element={<PermissionRoute permission={PERM_CA_VIEW} />}>
            <Route index element={<CaPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/ca" replace />} />
    </Routes>
  )
}
