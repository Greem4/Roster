import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

/**
 * Назначение основателя (один раз): bootstrap-супер-админ выбирает учётную запись.
 */
export default function PromoteFounderBlock() {
  const { user, refresh } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.can_promote_founder) return
    api.users
      .list()
      .then((list) => {
        setUsers(list.filter((u) => !u.is_founder && u.id !== user.id))
      })
      .catch((e) => setError(e.message))
  }, [user])

  if (!user?.can_promote_founder) return null

  const handlePromote = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    const target = users.find((u) => String(u.id) === selectedId)
    if (
      !window.confirm(
        `Назначить основателем пользователя «${target?.username}»? Это действие нельзя отменить.`,
      )
    ) {
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.users.makeFounder(Number(selectedId))
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="cabinet-section cabinet-section--warn">
      <h3 className="section-title">Назначить основателя</h3>
      <p className="muted">
        Один раз укажите учётную запись с полным доступом (рекомендуется — ваш логин после
        регистрации и смены пароля). После этого супер-админ <strong>admin</strong> можно удалить.
      </p>
      <form className="cabinet-form cabinet-form--inline" onSubmit={handlePromote}>
        <label>
          Пользователь
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} required>
            <option value="">— выберите —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
                {u.email ? ` (${u.email})` : ''}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary" disabled={saving || !selectedId}>
          {saving ? 'Назначение…' : 'Сделать основателем'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  )
}
