import YandexLoginButton from './YandexLoginButton'

/**
 * Кнопка входа/регистрации через Яндекс и разделитель «или» для форм логина/регистрации.
 * @param {{ disabled?: boolean, mode?: 'login' | 'register', onOAuthSuccess?: () => void, onOAuthPending?: () => void }} props
 */
export default function AuthOAuthSection({
  disabled = false,
  mode = 'login',
  onOAuthSuccess,
  onOAuthPending,
}) {
  return (
    <div className="auth-oauth">
      <YandexLoginButton
        disabled={disabled}
        mode={mode}
        onSuccess={onOAuthSuccess}
        onPending={onOAuthPending}
      />
      <p className="muted auth-oauth-hint">
        {mode === 'register'
          ? 'Новый аккаунт ждёт одобрения администратора.'
          : 'Для аккаунта, уже привязанного к Яндекс ID.'}
      </p>
      <div className="auth-oauth-divider" role="presentation">
        <span>или</span>
      </div>
    </div>
  )
}
