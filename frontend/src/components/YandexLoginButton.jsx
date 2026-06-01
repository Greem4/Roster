import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCachedYandexAvatar, YANDEX_AVATAR_EVENT } from '../utils/yandexAvatar'
import { formatAuthError } from '../utils/authErrors'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const LABELS = {
  login: 'Войти с Яндекс ID',
  register: 'Регистрация с Яндекс ID',
}

const POPUP_FEATURES =
  'popup=yes,width=520,height=720,menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes'

/**
 * Кнопка Яндекс ID в стиле официальной плашки: логотип слева, подпись по центру, аватар справа.
 * @param {{ disabled?: boolean, mode?: 'login' | 'register', onSuccess?: () => void, onPending?: () => void, onError?: (message: string) => void }} props
 */
export default function YandexLoginButton({
  disabled = false,
  mode = 'login',
  onSuccess,
  onPending,
  onError,
}) {
  const { loginWithToken, user } = useAuth()
  const [oauthPending, setOauthPending] = useState(false)
  const [localError, setLocalError] = useState('')
  const [cachedAvatar, setCachedAvatar] = useState(() => getCachedYandexAvatar())

  const reportError = useCallback(
    (message) => {
      const text = formatAuthError(message)
      if (onError) {
        onError(text)
        setLocalError('')
      } else {
        setLocalError(text)
      }
    },
    [onError],
  )

  const avatarUrl = user?.avatar_url || cachedAvatar

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
        reportError('')
        if (mode === 'register') {
          onPending?.()
        } else {
          reportError('Аккаунт ожидает подтверждения администратором')
        }
        return
      }

      if (data.error) {
        reportError(data.error)
        return
      }

      if (!data.token) return

      try {
        await loginWithToken(data.token)
        const fresh = getCachedYandexAvatar()
        if (fresh) setCachedAvatar(fresh)
        reportError('')
        onSuccess?.()
      } catch (err) {
        reportError(err.message || 'Ошибка входа')
      }
    },
    [loginWithToken, mode, onPending, onSuccess, reportError],
  )

  useEffect(() => {
    window.addEventListener('message', handleOAuthMessage)
    return () => window.removeEventListener('message', handleOAuthMessage)
  }, [handleOAuthMessage])

  useEffect(() => {
    const syncAvatar = () => setCachedAvatar(getCachedYandexAvatar())
    window.addEventListener(YANDEX_AVATAR_EVENT, syncAvatar)
    window.addEventListener('storage', syncAvatar)
    return () => {
      window.removeEventListener(YANDEX_AVATAR_EVENT, syncAvatar)
      window.removeEventListener('storage', syncAvatar)
    }
  }, [])

  useEffect(() => {
    if (user?.avatar_url) {
      setCachedAvatar(user.avatar_url)
    }
  }, [user?.avatar_url])

  const startOAuth = async () => {
    if (disabled || oauthPending) return
    reportError('')

    try {
      const res = await fetch(`${API_BASE}/auth/yandex/status`)
      const data = await res.json()
      if (!data.configured) {
        reportError(
          'Яндекс OAuth не настроен на сервере. Заполните YANDEX_CLIENT_ID и YANDEX_CLIENT_SECRET в .env и выполните ./scripts/deploy-backend.sh --with-env',
        )
        return
      }
    } catch {
      reportError('Не удалось проверить настройки Яндекс OAuth')
      return
    }

    const url = buildOAuthUrl()
    const popup = window.open(url, 'roster_yandex_oauth', POPUP_FEATURES)

    if (!popup) {
      reportError('Разрешите всплывающие окна для этого сайта и нажмите снова')
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
        <span className="yandex-plaque__logo" aria-hidden="true">
          <span className="yandex-plaque__logo-mark">Я</span>
        </span>
        <span className="yandex-plaque__label">{oauthPending ? 'Ожидаем Яндекс…' : label}</span>
        <span className="yandex-plaque__avatar" aria-hidden="true">
          {avatarUrl ? (
            <img className="yandex-plaque__avatar-img" src={avatarUrl} alt="" />
          ) : (
            <span className="yandex-plaque__avatar-placeholder" />
          )}
        </span>
      </button>
      {localError && (
        <p className="yandex-plaque__error" role="alert">
          {localError}
        </p>
      )}
    </div>
  )
}
