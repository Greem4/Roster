import { Navigate, Route, Routes } from 'react-router-dom'
import CaPage from './pages/CaPage'

/**
 * Маршруты RosterCA. Изолированы от Pay и RX.
 */
export default function CaRoutes() {
  return (
    <Routes>
      <Route index element={<CaPage />} />
      <Route path="*" element={<Navigate to="/ca" replace />} />
    </Routes>
  )
}
