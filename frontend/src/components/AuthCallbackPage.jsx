import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RX_HOME } from '../constants/routes'
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
    const oauthPending = searchParams.get('oauth_pending')

    const notifyOpener = (payload) => {
      if (!window.opener || window.opener.closed) return false
      window.opener.postMessage(
        { type: 'roster-yandex-oauth', ...payload },
        window.location.origin,
      )
      window.close()
      return true
    }

    if (oauthPending) {
      if (notifyOpener({ pending: true })) return
      setMessage('Заявка отправлена. Дождитесь одобрения администратора.')
      return
    }

    if (oauthError) {
      if (notifyOpener({ error: oauthError })) return
      setMessage(oauthError)
      return
    }

    if (!token) {
      if (notifyOpener({ error: 'Не получен токен авторизации' })) return
      setMessage('Не получен токен авторизации')
      return
    }

    if (notifyOpener({ token })) return

    let cancelled = false
    ;(async () => {
      try {
        await loginWithToken(token)
        if (!cancelled) navigate(RX_HOME, { replace: true })
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
