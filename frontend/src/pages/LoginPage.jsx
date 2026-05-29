import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import { useAuth } from '../context/AuthContext'

/** Отдельная страница входа (без модального окна). */
export default function LoginPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/cabinet'

  if (isAuthenticated) return <Navigate to={from} replace />

  const handleSuccess = () => {
    navigate(from, { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Вход</h1>
        <LoginForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
