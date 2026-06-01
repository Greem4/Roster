import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthOAuthSection from './AuthOAuthSection'
import { useAuth } from '../context/AuthContext'

/**
 * Форма входа: логин и пароль. Используется в модальном окне и на отдельной странице.
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
      setError(err.message || 'Ошибка входа')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <AuthOAuthSection disabled={submitting} mode="login" onOAuthSuccess={onSuccess} />
      <label>
        Логин
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
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
