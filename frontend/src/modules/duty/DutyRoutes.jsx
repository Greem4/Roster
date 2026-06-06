import { Navigate, Route, Routes } from 'react-router-dom'
import DutyPage from './pages/DutyPage'

/**
 * Маршруты RosterDuty. Изолированы от CA, Pay и RX.
 */
export default function DutyRoutes() {
  return (
    <Routes>
      <Route index element={<DutyPage />} />
      <Route path="*" element={<Navigate to="/duty" replace />} />
    </Routes>
  )
}
