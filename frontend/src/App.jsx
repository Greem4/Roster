import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ActiveUserRoute, PermissionRoute, ProtectedRoute } from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import MedicineEditRedirect from './components/MedicineEditRedirect'
import MedicinesLayout from './components/MedicinesLayout'
import AdminUsersOverlay from './components/overlays/AdminUsersOverlay'
import CabinetOverlay from './components/overlays/CabinetOverlay'
import LoginOverlay from './components/overlays/LoginOverlay'
import RegisterOverlay from './components/overlays/RegisterOverlay'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route element={<MedicinesLayout />}>
              <Route path="/medicines" />
              <Route path="/" element={<Navigate to="/medicines" replace />} />
              <Route path="/login" element={<LoginOverlay />} />
              <Route path="/register" element={<RegisterOverlay />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/cabinet" element={<CabinetOverlay />} />
                <Route element={<ActiveUserRoute />}>
                  <Route element={<PermissionRoute permission="users:manage" />}>
                    <Route
                      path="/medicines/new"
                      element={<Navigate to="/medicines?add=1" replace />}
                    />
                    <Route path="/medicines/:id/edit" element={<MedicineEditRedirect />} />
                    <Route path="/admin/users" element={<AdminUsersOverlay />} />
                  </Route>
                </Route>
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/medicines" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
