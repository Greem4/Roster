import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const LABELS = {
  login: 'Войти с Яндекс ID',
  register: 'Зарегистрироваться через Яндекс ID',
}

const POPUP_FEATURES =
  'popup=yes,width=520,height=720,menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes'

/**
 * Кнопка-плашка Яндекс ID: по клику сразу открывает окно OAuth.
 * @param {{ disabled?: boolean, mode?: 'login' | 'register', onSuccess?: () => void, onPending?: () => void }} props
 */
export default function YandexLoginButton({
  disabled = false,
  mode = 'login',
  onSuccess,
  onPending,
}) {
  const { loginWithToken } = useAuth()
  const [oauthPending, setOauthPending] = useState(false)
  const [error, setError] = useState('')

  const label = LABELS[mode] ?? LABELS.login

  const buildOAuthUrl = useCallback(() => {
    const returnTo = `${window.location.origin}/auth/callback`
    return `${API_BASE}/auth/yandex/start?${new URLSearchParams({ return_to: returnTo })}`
  }, [])

  const handleOAuthMessage = useCallback(
    async (event) => {
      if (event.origin !== window.location.origin) return
      const data = event.data
      if (!data || data.type !== 'roster-yandex-oauth') return

      setOauthPending(false)

      if (data.pending) {
        setError('')
        if (mode === 'register') {
          onPending?.()
        } else {
          setError('Аккаунт ожидает подтверждения администратором')
        }
        return
      }

      if (data.error) {
        setError(data.error)
        return
      }

      if (!data.token) return

      try {
        await loginWithToken(data.token)
        setError('')
        onSuccess?.()
      } catch (err) {
        setError(err.message || 'Ошибка входа')
      }
    },
    [loginWithToken, mode, onPending, onSuccess],
  )

  useEffect(() => {
    window.addEventListener('message', handleOAuthMessage)
    return () => window.removeEventListener('message', handleOAuthMessage)
  }, [handleOAuthMessage])

  const startOAuth = async () => {
    if (disabled || oauthPending) return
    setError('')

    try {
      const res = await fetch(`${API_BASE}/auth/yandex/status`)
      const data = await res.json()
      if (!data.configured) {
        setError(
          'Яндекс OAuth не настроен на сервере. Заполните YANDEX_CLIENT_ID и YANDEX_CLIENT_SECRET в .env и выполните ./scripts/deploy-backend.sh --with-env',
        )
        return
      }
    } catch {
      setError('Не удалось проверить настройки Яндекс OAuth')
      return
    }

    const url = buildOAuthUrl()
    const popup = window.open(url, 'roster_yandex_oauth', POPUP_FEATURES)

    if (!popup) {
      setError('Разрешите всплывающие окна для этого сайта и нажмите снова')
      return
    }

    setOauthPending(true)
    popup.focus()

    const timer = window.setInterval(() => {
      if (!popup.closed) return
      window.clearInterval(timer)
      setOauthPending(false)
    }, 400)
  }

  return (
    <div className={`yandex-plaque${oauthPending ? ' yandex-plaque--pending' : ''}`}>
      <button
        type="button"
        className="yandex-plaque__btn"
        disabled={disabled || oauthPending}
        onClick={startOAuth}
      >
        <span className="yandex-plaque__glow" aria-hidden="true" />
        <span className="yandex-plaque__avatar" aria-hidden="true">
          <span className="yandex-plaque__avatar-ring" />
          <span className="yandex-plaque__avatar-face" />
        </span>
        <span className="yandex-plaque__label">{oauthPending ? 'Ожидаем Яндекс…' : label}</span>
        <span className="yandex-plaque__logo" aria-hidden="true">
          Я
        </span>
      </button>
      {error && (
        <p className="yandex-plaque__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
