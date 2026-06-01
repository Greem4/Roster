import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import AuthOAuthSection from './AuthOAuthSection'

/**
 * Форма регистрации нового пользователя.
 * @param {{ onSuccess?: () => void }} props
 */
export default function RegisterForm({ onSuccess }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.register({
        username,
        password,
        email: email || undefined,
      })
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="login-form auth-form" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <AuthOAuthSection
        disabled={submitting}
        mode="register"
        onOAuthSuccess={() => navigate('/medicines', { replace: true })}
        onOAuthPending={onSuccess}
      />
      <label>
        Логин
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
        />
      </label>
      <label>
        Email (необязательно)
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Пароль
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </label>
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Отправка…' : 'Зарегистрироваться'}
      </button>
      <p className="muted login-form-footer">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </form>
  )
}
