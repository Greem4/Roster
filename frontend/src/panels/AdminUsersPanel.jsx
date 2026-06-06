import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import UserModuleAccess from '../components/cabinet/UserModuleAccess'
import UserRoleSelect from '../components/cabinet/UserRoleSelect'
import { IconSave, IconTrash } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { userModulePermissions } from '../constants/moduleAccess'
import { assignableRoles, userEffectiveRole } from '../utils/userRole'

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

function userInitials(username) {
  const parts = (username || '?').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  const s = parts[0] || '?'
  return s.slice(0, 2).toUpperCase()
}

function usersCountLabel(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} пользователь`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} пользователя`
  return `${n} пользователей`
}

function UserAvatar({ user }) {
  if (user.avatar_url) {
    return (
      <img
        className="users-table__avatar-img"
        src={user.avatar_url}
        alt=""
        width={32}
        height={32}
      />
    )
  }
  return (
    <span className="users-table__avatar-fallback" aria-hidden>
      {userInitials(user.username)}
    </span>
  )
}

/** Список пользователей — часть страницы кабинета, без отдельной «карточки». */
export default function AdminUsersPanel() {
  const { user: current } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  const setRole = (userId, role) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u
        if (role === 'superadmin') {
          return {
            ...u,
            is_founder: false,
            is_superadmin: true,
            permissions: [],
            role: 'superadmin',
          }
        }
        if (role === 'admin') {
          const perms = u.permissions.includes('users:manage')
            ? u.permissions
            : [...u.permissions, 'users:manage']
          return {
            ...u,
            is_founder: false,
            is_superadmin: false,
            permissions: perms,
            role: 'admin',
          }
        }
        if (role === 'user') {
          return {
            ...u,
            is_founder: false,
            is_superadmin: false,
            permissions: u.permissions.filter((p) => p !== 'users:manage'),
            role: 'user',
          }
        }
        return u
      }),
    )
  }

  const toggleModulePermission = (userId, code) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u
        const has = u.permissions.includes(code)
        const permissions = has
          ? u.permissions.filter((p) => p !== code)
          : [...u.permissions, code]
        return { ...u, permissions }
      }),
    )
  }

  const saveUser = async (user) => {
    setSavingId(user.id)
    setError('')
    try {
      const payload = { is_active: user.is_active }
      const roleOptions = assignableRoles(current, user)
      if (roleOptions.length > 0) {
        payload.role = userEffectiveRole(user)
      }
      if (!user.is_founder && !user.is_superadmin) {
        payload.permissions = userModulePermissions(user)
      }
      await api.users.update(user.id, payload)
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

  return (
    <div className="cabinet-panel admin-users-page">
      <div className="admin-users-page__bar">
        <p className="muted admin-users-page__hint">
          Роли и активация. Супер-админа назначает основатель. Удаление — у основателя.
        </p>
        {!loading && users.length > 0 && (
          <div className="admin-users-page__tools">
            <span className="admin-users-page__count">{usersCountLabel(users.length)}</span>
            <input
              type="search"
              className="admin-users-page__search"
              placeholder="Поиск…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              aria-label="Поиск по имени или email"
            />
          </div>
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
        <>
          <table className="users-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Email</th>
                <th className="users-table__th-center">Активен</th>
                <th>Роль</th>
                <th>Разделы</th>
                <th className="users-table__th-actions" />
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const editable = current && isEditableByCurrent(current, u)
                const canDelete = current?.is_founder && u.id !== current.id && !u.is_founder
                const busy = savingId === u.id || deletingId === u.id
                const saving = savingId === u.id

                return (
                  <tr
                    key={u.id}
                    className={!u.is_active ? 'users-table__row--inactive' : undefined}
                  >
                    <td className="users-table__user">
                      <UserAvatar user={u} />
                      <span className="users-table__name">{u.username}</span>
                    </td>
                    <td className="users-table__email">
                      {u.email ? (
                        <a className="users-table__email-link" href={`mailto:${u.email}`}>
                          {u.email}
                        </a>
                      ) : (
                        <span className="users-table__email-empty">—</span>
                      )}
                    </td>
                    <td className="users-table__active">
                      <label
                        className={`users-table__toggle${u.is_active ? ' users-table__toggle--on' : ''}`}
                        title={u.is_active ? 'Активен' : 'Неактивен'}
                      >
                        <input
                          type="checkbox"
                          className="users-table__toggle-input"
                          checked={u.is_active}
                          disabled={!editable || u.is_founder}
                          onChange={(e) => updateLocal(u.id, { is_active: e.target.checked })}
                        />
                        <span className="users-table__toggle-track" aria-hidden />
                      </label>
                    </td>
                    <td className="users-table__role">
                      <UserRoleSelect user={u} current={current} onSetRole={setRole} />
                    </td>
                    <td className="users-table__modules-cell">
                      <UserModuleAccess
                        user={u}
                        editable={!!editable}
                        onToggle={toggleModulePermission}
                      />
                    </td>
                    <td className="users-table__actions">
                      <button
                        type="button"
                        className="btn-icon btn-icon--save"
                        disabled={!editable || busy}
                        onClick={() => saveUser(u)}
                        aria-label={saving ? 'Сохранение…' : 'Сохранить'}
                        title="Сохранить"
                      >
                        <IconSave />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon--danger"
                        disabled={!canDelete || busy}
                        onClick={() => setDeleteTarget(u)}
                        aria-label="Удалить"
                        title="Удалить"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredUsers.length !== users.length && (
            <p className="muted users-table__hint">
              Показано {filteredUsers.length} из {users.length}
            </p>
          )}
        </>
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
    </div>
  )
}
