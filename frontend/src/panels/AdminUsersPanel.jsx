import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import ResetUserPasswordDialog from '../components/cabinet/ResetUserPasswordDialog'
import UserAssignmentPopover from '../components/cabinet/UserAssignmentPopover'
import { useAuth } from '../context/AuthContext'

function isEditableByCurrent(current, target) {
  if (current.id === target.id) return true
  if (target.is_founder) return false
  if (current.is_founder) return true
  if (target.is_superadmin) return false
  if (current.is_superadmin) return true
  return !target.is_superadmin && !target.is_founder
}

function matchesQuery(user, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    user.username.toLowerCase().includes(q) ||
    (user.email || '').toLowerCase().includes(q)
  )
}

/** Управление пользователями: таблица, роли во всплывающей строке. */
export default function AdminUsersPanel() {
  const { user: current } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [passwordTarget, setPasswordTarget] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    api.users
      .list()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filteredUsers = useMemo(
    () => users.filter((u) => matchesQuery(u, search)),
    [users, search],
  )

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

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    setError('')
    try {
      await api.users.delete(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setDeletingId(null)
    }
  }

  const confirmPasswordReset = async (password) => {
    if (!passwordTarget) return
    setSavingId(passwordTarget.id)
    setError('')
    try {
      await api.users.update(passwordTarget.id, { password })
      setPasswordTarget(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="cabinet-panel admin-users-panel">
      <div className="admin-users-panel__toolbar">
        <p className="muted admin-users-panel__lead">
          Учётные записи, активация и права. Удаление — только у основателя.
        </p>
        {!loading && users.length > 0 && (
          <label className="admin-users-panel__search">
            <span className="visually-hidden">Поиск</span>
            <input
              type="search"
              placeholder="Поиск…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </label>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Загрузка…</p>}
      {!loading && users.length === 0 && !error && (
        <p className="muted">Пользователей пока нет.</p>
      )}
      {!loading && users.length > 0 && filteredUsers.length === 0 && (
        <p className="muted">Ничего не найдено.</p>
      )}

      {!loading && filteredUsers.length > 0 && (
        <div className="users-table-wrap">
          <table className="users-table">
            <colgroup>
              <col className="users-table__col-name" />
              <col className="users-table__col-email" />
              <col className="users-table__col-active" />
              <col className="users-table__col-assign" />
              <col className="users-table__col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Email</th>
                <th>Активен</th>
                <th>Назначение</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const editable = current && isEditableByCurrent(current, u)
                const canEditPerms = editable && (u.role === 'user' || u.role === 'admin')
                const canDelete = current?.is_founder && u.id !== current.id && !u.is_founder
                const canPassword = editable && u.role !== 'founder'
                const busy = savingId === u.id || deletingId === u.id

                return (
                  <tr
                    key={u.id}
                    className={!u.is_active ? 'users-table__row--inactive' : undefined}
                  >
                    <td className="users-table__name">{u.username}</td>
                    <td className="users-table__email">
                      <input
                        type="email"
                        value={u.email || ''}
                        disabled={!editable}
                        placeholder="—"
                        onChange={(e) => updateLocal(u.id, { email: e.target.value })}
                      />
                    </td>
                    <td className="users-table__active">
                      <label className="users-table__active-check">
                        <input
                          type="checkbox"
                          checked={u.is_active}
                          disabled={!editable || u.is_founder}
                          onChange={(e) => updateLocal(u.id, { is_active: e.target.checked })}
                        />
                        <span className="visually-hidden">Активен</span>
                      </label>
                    </td>
                    <td className="users-table__assign">
                      <UserAssignmentPopover
                        user={u}
                        canEditPermissions={canEditPerms}
                        onTogglePermission={togglePermission}
                      />
                    </td>
                    <td className="users-table__actions">
                      <button
                        type="button"
                        className="users-table__btn"
                        disabled={!editable || busy}
                        onClick={() => saveUser(u)}
                      >
                        {savingId === u.id ? '…' : 'Сохранить'}
                      </button>
                      <button
                        type="button"
                        className="users-table__btn"
                        disabled={!canPassword || busy}
                        onClick={() => setPasswordTarget(u)}
                      >
                        Пароль
                      </button>
                      <button
                        type="button"
                        className="users-table__btn users-table__btn--danger"
                        disabled={!canDelete || busy}
                        onClick={() => setDeleteTarget(u)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="muted users-table__count">
            {filteredUsers.length === users.length
              ? `Всего: ${users.length}`
              : `${filteredUsers.length} из ${users.length}`}
          </p>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Удалить пользователя"
          message={
            <>
              Удалить <strong>{deleteTarget.username}</strong>? Необратимо.
            </>
          }
          confirmLabel="Удалить"
          confirming={deletingId === deleteTarget.id}
          onConfirm={confirmDelete}
          onClose={() => !deletingId && setDeleteTarget(null)}
        />
      )}

      {passwordTarget && (
        <ResetUserPasswordDialog
          username={passwordTarget.username}
          saving={savingId === passwordTarget.id}
          onConfirm={confirmPasswordReset}
          onClose={() => !savingId && setPasswordTarget(null)}
        />
      )}
    </div>
  )
}
