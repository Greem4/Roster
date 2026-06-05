import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ActiveUserRoute, PermissionRoute, ProtectedRoute } from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import MedicineEditRedirect from './components/MedicineEditRedirect'
import MedicinesLayout from './components/MedicinesLayout'
import LoginOverlay from './components/overlays/LoginOverlay'
import CabinetPage from './pages/CabinetPage'
import ModulePlaceholderPage from './pages/ModulePlaceholderPage'
import CaRoutes from './modules/ca/CaRoutes'
import PayRoutes from './modules/pay/PayRoutes'
import RegisterOverlay from './components/overlays/RegisterOverlay'
import AuthCallbackPage from './components/AuthCallbackPage'
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
            <Route path="/duty" element={<ModulePlaceholderPage moduleKey="duty" />} />
            <Route path="/ca/*" element={<CaRoutes />} />
            <Route path="/pay/*" element={<PayRoutes />} />
            <Route element={<MedicinesLayout />}>
              <Route path="/medicines" />
              <Route path="/" element={<Navigate to="/medicines" replace />} />
              <Route path="/login" element={<LoginOverlay />} />
              <Route path="/register" element={<RegisterOverlay />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<ActiveUserRoute />}>
                  <Route element={<PermissionRoute permission="users:manage" />}>
                    <Route
                      path="/medicines/new"
                      element={<Navigate to="/medicines?add=1" replace />}
                    />
                    <Route path="/medicines/:id/edit" element={<MedicineEditRedirect />} />
                  </Route>
                </Route>
              </Route>
            </Route>
            <Route
              path="/admin/users"
              element={<Navigate to="/cabinet/users" replace />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/medicines" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
