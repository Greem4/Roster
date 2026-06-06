import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  ActiveUserRoute,
  PermissionRoute,
  ProtectedRoute,
} from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import AuthCallbackPage from './components/AuthCallbackPage'
import LoginOverlay from './components/overlays/LoginOverlay'
import RegisterOverlay from './components/overlays/RegisterOverlay'
import CabinetPage from './pages/CabinetPage'
import CaRoutes from './modules/ca/CaRoutes'
import DutyRoutes from './modules/duty/DutyRoutes'
import PayRoutes from './modules/pay/PayRoutes'
import LegacyMedicinesRedirect from './modules/rx/components/LegacyMedicinesRedirect'
import MedicineEditRedirect from './modules/rx/components/MedicineEditRedirect'
import MedicinesLayout from './modules/rx/components/MedicinesLayout'
import { PERM_RX_MANAGE } from './modules/rx/constants'
import { RX_HOME } from './constants/routes'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route element={<AppShell />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/cabinet/*" element={<CabinetPage />} />
            </Route>
            <Route path="/duty/*" element={<DutyRoutes />} />
            <Route path="/ca/*" element={<CaRoutes />} />
            <Route path="/pay/*" element={<PayRoutes />} />
            <Route element={<MedicinesLayout />}>
              <Route path={RX_HOME} />
              <Route path="/login" element={<LoginOverlay />} />
              <Route path="/register" element={<RegisterOverlay />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<ActiveUserRoute />}>
                  <Route element={<PermissionRoute permission={PERM_RX_MANAGE} />}>
                    <Route
                      path={`${RX_HOME}/new`}
                      element={<Navigate to={`${RX_HOME}?add=1`} replace />}
                    />
                    <Route path={`${RX_HOME}/:id/edit`} element={<MedicineEditRedirect />} />
                  </Route>
                </Route>
              </Route>
            </Route>
            <Route index element={<Navigate to={RX_HOME} replace />} />
            <Route path="/medicines" element={<Navigate to={RX_HOME} replace />} />
            <Route path="/medicines/*" element={<LegacyMedicinesRedirect />} />
            <Route
              path="/admin/users"
              element={<Navigate to="/cabinet/users" replace />}
            />
          </Route>
          <Route path="*" element={<Navigate to={RX_HOME} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
