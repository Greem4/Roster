import { useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

/** Смена или первичная установка пароля в личном кабинете. */
export default function ChangePasswordForm() {
  const { user, refresh } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const needsCurrent = user?.has_password

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword.length < 6) {
      setError('Новый пароль — не менее 6 символов')
      return
    }
    if (newPassword !== confirm) {
      setError('Пароли не совпадают')
      return
    }
    setSaving(true)
    try {
      await api.auth.changePassword({
        current_password: needsCurrent ? currentPassword : undefined,
        new_password: newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      setSuccess(needsCurrent ? 'Пароль изменён' : 'Пароль установлен')
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="cabinet-form" onSubmit={handleSubmit}>
      {needsCurrent && (
        <label>
          Текущий пароль
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
      )}
      <label>
        {needsCurrent ? 'Новый пароль' : 'Пароль для входа'}
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
        />
      </label>
      <label>
        Повторите пароль
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
        />
      </label>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Сохранение…' : needsCurrent ? 'Сменить пароль' : 'Установить пароль'}
      </button>
    </form>
  )
}
