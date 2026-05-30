const API_BASE = import.meta.env.VITE_API_URL || '/api'

const LABELS = {
  login: 'Войти с Яндекс ID',
  register: 'Зарегистрироваться через Яндекс ID',
}

/**
 * Кнопка OAuth Яндекс в фирменном стиле (тёмная плашка, логотип «Я»).
 * @param {{ disabled?: boolean, mode?: 'login' | 'register' }} props
 */
export default function YandexLoginButton({ disabled = false, mode = 'login' }) {
  const returnTo = `${window.location.origin}/auth/callback`
  const href = `${API_BASE}/auth/yandex/start?${new URLSearchParams({ return_to: returnTo })}`

  return (
    <a
      className="yandex-login-btn"
      href={href}
      aria-disabled={disabled}
      onClick={(e) => disabled && e.preventDefault()}
    >
      <span className="yandex-login-btn__logo" aria-hidden="true">
        Я
      </span>
      <span className="yandex-login-btn__text">{LABELS[mode] ?? LABELS.login}</span>
    </a>
  )
}
