import YandexLoginButton from './YandexLoginButton'

/**
 * Кнопка входа/регистрации через Яндекс и разделитель «или» для форм логина/регистрации.
 * @param {{ disabled?: boolean, mode?: 'login' | 'register' }} props
 */
export default function AuthOAuthSection({ disabled = false, mode = 'login' }) {
  return (
    <div className="auth-oauth">
      <YandexLoginButton disabled={disabled} mode={mode} />
      <p className="muted auth-oauth-hint">
        {mode === 'register'
          ? 'Новый аккаунт через Яндекс ID ждёт одобрения администратора.'
          : 'Вход через Яндекс ID для уже привязанного аккаунта.'}
      </p>
      <div className="auth-oauth-divider" role="presentation">
        <span>или</span>
      </div>
    </div>
  )
}
