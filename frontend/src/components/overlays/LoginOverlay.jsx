import { Navigate, useNavigate } from 'react-router-dom'
import LoginForm from '../LoginForm'
import RouteModal from '../RouteModal'
import { useAuth } from '../../context/AuthContext'

/** Вход поверх списка лекарств; после успеха — только таблица, без лишних экранов. */
export default function LoginOverlay() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) return <Navigate to="/medicines" replace />

  const handleSuccess = () => {
    navigate('/medicines', { replace: true })
  }

  return (
    <RouteModal title="Вход">
      <LoginForm onSuccess={handleSuccess} />
    </RouteModal>
  )
}
