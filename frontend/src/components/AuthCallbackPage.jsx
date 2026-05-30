import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Страница возврата после OAuth Яндекс: принимает token или oauth_error из query.
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()
  const [message, setMessage] = useState('Завершаем вход…')

  useEffect(() => {
    const token = searchParams.get('token')
    const oauthError = searchParams.get('oauth_error')

    if (oauthError) {
      setMessage(oauthError)
      return
    }

    if (!token) {
      setMessage('Не получен токен авторизации')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        await loginWithToken(token)
        if (!cancelled) navigate('/medicines', { replace: true })
      } catch (err) {
        if (!cancelled) setMessage(err.message || 'Ошибка входа')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, loginWithToken, navigate])

  const hasError = searchParams.get('oauth_error') || message !== 'Завершаем вход…'

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>{hasError ? 'Вход не выполнен' : 'Вход'}</h1>
        <p className={hasError ? 'error' : 'muted'}>{message}</p>
        {hasError && (
          <p className="login-form-footer">
            <Link to="/login">Вернуться ко входу</Link>
          </p>
        )}
      </div>
    </div>
  )
}
