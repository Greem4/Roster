import { Navigate, Route, Routes } from 'react-router-dom'
import { ActiveUserRoute, PermissionRoute, ProtectedRoute } from '../../components/ProtectedRoute'
import { PERM_PAY_VIEW } from './constants'
import PayPage from './pages/PayPage'

/**
 * Маршруты RosterPay. Изменения Pay не должны трогать MedicinesLayout и /medicines.
 */
export default function PayRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<ActiveUserRoute />}>
          <Route element={<PermissionRoute permission={PERM_PAY_VIEW} />}>
            <Route index element={<PayPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/pay" replace />} />
    </Routes>
  )
}
