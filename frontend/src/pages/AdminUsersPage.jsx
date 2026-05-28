import { useEffect, useState } from 'react'
import { api } from '../api/client'

const ALL_PERMISSIONS = [
  { code: 'medicines:view', label: 'Просмотр лекарств' },
  { code: 'medicines:edit', label: 'Редактирование лекарств' },
  { code: 'users:manage', label: 'Управление пользователями' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = () => {
    api.users
      .list()
      .then(setUsers)
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
  }, [])

  const updateLocal = (userId, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)))
  }

  const togglePermission = (userId, code) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u
        const has = u.permissions.includes(code)
        return {
          ...u,
          permissions: has ? u.permissions.filter((p) => p !== code) : [...u.permissions, code],
        }
      }),
    )
  }

  const saveUser = async (user) => {
    setSavingId(user.id)
    setError('')
    try {
      await api.users.update(user.id, {
        is_active: user.is_active,
        permissions: user.permissions,
        email: user.email || undefined,
      })
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <h1>Пользователи</h1>
      {error && <p className="error">{error}</p>}
      <div className="users-grid">
        {users.map((u) => (
          <div key={u.id} className="card user-card">
            <div className="user-card-header">
              <strong>{u.username}</strong>
              {u.is_superadmin && <span className="badge badge-ok">супер-админ</span>}
            </div>
            <label>
              Email
              <input
                type="email"
                value={u.email || ''}
                disabled={u.is_superadmin}
                onChange={(e) => updateLocal(u.id, { email: e.target.value })}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={u.is_active}
                disabled={u.is_superadmin}
                onChange={(e) => updateLocal(u.id, { is_active: e.target.checked })}
              />
              Активен
            </label>
            {!u.is_superadmin && (
              <div className="permissions">
                <p className="muted">Права доступа</p>
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p.code} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={u.permissions.includes(p.code)}
                      onChange={() => togglePermission(u.id, p.code)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            )}
            {!u.is_superadmin && (
              <button
                type="button"
                className="btn-primary"
                disabled={savingId === u.id}
                onClick={() => saveUser(u)}
              >
                {savingId === u.id ? 'Сохранение…' : 'Сохранить'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
