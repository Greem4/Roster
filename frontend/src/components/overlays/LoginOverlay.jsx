import { Navigate, useNavigate } from 'react-router-dom'
import LoginForm from '../LoginForm'
import RouteModal from '../RouteModal'
import { RX_HOME } from '../../constants/routes'
import { useAuth } from '../../context/AuthContext'

/** Вход поверх списка лекарств; после успеха — только таблица, без лишних экранов. */
export default function LoginOverlay() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) return <Navigate to={RX_HOME} replace />

  const handleSuccess = () => {
    navigate(RX_HOME, { replace: true })
  }

  return (
    <RouteModal title="Вход" size="auth">
      <LoginForm onSuccess={handleSuccess} />
    </RouteModal>
  )
}
