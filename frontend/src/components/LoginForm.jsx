import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthOAuthSection from './AuthOAuthSection'
import { useAuth } from '../context/AuthContext'
import { formatAuthError } from '../utils/authErrors'

/**
 * Форма входа: логин или почта и пароль. Используется в модальном окне и на отдельной странице.
 * @param {{ onSuccess?: () => void, showRegisterLink?: boolean }} props
 */
export default function LoginForm({ onSuccess, showRegisterLink = true }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
      onSuccess?.()
    } catch (err) {
      setError(formatAuthError(err.message) || 'Ошибка входа')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="login-form auth-form" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <AuthOAuthSection
        disabled={submitting}
        mode="login"
        onOAuthSuccess={onSuccess}
        onOAuthError={setError}
      />
      <label>
        Логин или почта
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          placeholder="логин или name@example.ru"
          required
        />
        <span className="muted auth-field-hint">Можно ввести логин или адрес почты, привязанный к аккаунту.</span>
      </label>
      <label>
        Пароль
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Вход…' : 'Войти'}
      </button>
      {showRegisterLink && (
        <p className="muted login-form-footer">
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </p>
      )}
    </form>
  )
}
