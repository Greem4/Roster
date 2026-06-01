import { useState } from 'react'
import Modal from '../Modal'

/**
 * Сброс пароля пользователя администратором (минимум 6 символов).
 */
export default function ResetUserPasswordDialog({ username, saving, onConfirm, onClose }) {
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setLocalError('Пароль должен быть не короче 6 символов')
      return
    }
    setLocalError('')
    onConfirm(password)
  }

  const handleClose = () => {
    if (!saving) onClose()
  }

  return (
    <Modal title={`Пароль: ${username}`} onClose={handleClose}>
      <form className="cabinet-form" onSubmit={handleSubmit}>
        <label>
          Новый пароль
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            disabled={saving}
            onChange={(e) => {
              setPassword(e.target.value)
              setLocalError('')
            }}
            minLength={6}
            required
          />
        </label>
        {localError && <p className="error">{localError}</p>}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={saving}>
            Отмена
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
