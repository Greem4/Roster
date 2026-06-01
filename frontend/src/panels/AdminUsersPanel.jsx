import { useEffect, useState } from 'react'
import { api } from '../api/client'
import RoleBadge from '../components/cabinet/RoleBadge'
import { useAuth } from '../context/AuthContext'

const ALL_PERMISSIONS = [
  { code: 'users:manage', label: 'Администратор (пользователи и лекарства)' },
]

function isEditableByCurrent(current, target) {
  if (current.id === target.id) return true
  if (target.is_founder) return false
  if (current.is_founder) return true
  if (target.is_superadmin) return false
  if (current.is_superadmin) return true
  return !target.is_superadmin && !target.is_founder
}

/** Управление пользователями: роли, активация, удаление (основатель). */
export default function AdminUsersPanel() {
  const { user: current } = useAuth()
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

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

  const deleteUser = async (target) => {
    if (
      !window.confirm(
        `Удалить пользователя «${target.username}»? Действие необратимо.`,
      )
    ) {
      return
    }
    setDeletingId(target.id)
    setError('')
    try {
      await api.users.delete(target.id)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setDeletingId(null)
    }
  }

  const resetPassword = async (target) => {
    const pwd = window.prompt(`Новый пароль для «${target.username}» (мин. 6 символов):`)
    if (!pwd) return
    if (pwd.length < 6) {
      setError('Пароль должен быть не короче 6 символов')
      return
    }
    setSavingId(target.id)
    setError('')
    try {
      await api.users.update(target.id, { password: pwd })
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="cabinet-panel admin-users-panel">
      <p className="muted admin-users-panel__lead">
        Активация учётных записей, права доступа, сброс пароля и удаление (для основателя).
      </p>
      {error && <p className="error">{error}</p>}
      <div className="users-grid">
        {users.map((u) => {
          const editable = current && isEditableByCurrent(current, u)
          const showPerms = editable && (u.role === 'user' || u.role === 'admin')
          const canDelete = current?.is_founder && u.id !== current.id && !u.is_founder

          return (
            <div key={u.id} className="card user-card">
              <div className="user-card-header">
                <strong>{u.username}</strong>
                <RoleBadge role={u.role} />
              </div>
              <label>
                Email
                <input
                  type="email"
                  value={u.email || ''}
                  disabled={!editable}
                  onChange={(e) => updateLocal(u.id, { email: e.target.value })}
                />
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={u.is_active}
                  disabled={!editable || u.is_founder}
                  onChange={(e) => updateLocal(u.id, { is_active: e.target.checked })}
                />
                Активен
              </label>
              {showPerms && (
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
              <div className="user-card-actions">
                {editable && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={savingId === u.id}
                    onClick={() => saveUser(u)}
                  >
                    {savingId === u.id ? 'Сохранение…' : 'Сохранить'}
                  </button>
                )}
                {editable && u.role !== 'founder' && (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={savingId === u.id}
                    onClick={() => resetPassword(u)}
                  >
                    Сбросить пароль
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={deletingId === u.id}
                    onClick={() => deleteUser(u)}
                  >
                    {deletingId === u.id ? 'Удаление…' : 'Удалить'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
