import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ActiveUserRoute, PermissionRoute, ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import AdminUsersPage from './pages/AdminUsersPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import MedicineFormPage from './pages/MedicineFormPage'
import MedicinesPage from './pages/MedicinesPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route element={<ActiveUserRoute />}>
                <Route element={<PermissionRoute permission="medicines:view" />}>
                  <Route path="/medicines" element={<MedicinesPage />} />
                </Route>
                <Route element={<PermissionRoute permission="medicines:edit" />}>
                  <Route path="/medicines/new" element={<MedicineFormPage />} />
                  <Route path="/medicines/:id/edit" element={<MedicineFormPage />} />
                </Route>
                <Route element={<PermissionRoute permission="users:manage" />}>
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                </Route>
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
