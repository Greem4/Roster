import { useEffect, useId, useRef, useState } from 'react'
import { roleLabel } from '../../utils/userRole'

const ADMIN_PERM = {
  code: 'users:manage',
  label: 'Администратор — пользователи и лекарства',
}

/**
 * Краткая подпись роли для кнопки (без цветных бейджей).
 */
export function assignmentSummary(user) {
  if (user.is_founder) return 'Основатель'
  if (user.is_superadmin) return 'Супер-админ'
  if (user.role === 'admin' || user.permissions?.includes('users:manage')) return 'Администратор'
  return 'Пользователь'
}

/**
 * Всплывающая строка: роль и права доступа (не в ячейке таблицы).
 */
export default function UserAssignmentPopover({
  user,
  canEditPermissions,
  onTogglePermission,
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const popoverId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const hasAdmin = user.permissions?.includes(ADMIN_PERM.code)

  return (
    <div className="users-table__assign-wrap" ref={wrapRef}>
      <button
        type="button"
        className="users-table__assign-trigger"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((v) => !v)}
      >
        {assignmentSummary(user)}
      </button>
      {open && (
        <div id={popoverId} className="users-table__popover" role="dialog" aria-label="Назначение">
          <p className="users-table__popover-line">
            <span className="users-table__popover-k">Роль</span>
            {roleLabel(user.role)}
          </p>
          {canEditPermissions && (
            <label className="checkbox-row users-table__popover-check">
              <input
                type="checkbox"
                checked={hasAdmin}
                onChange={() => onTogglePermission(user.id, ADMIN_PERM.code)}
              />
              {ADMIN_PERM.label}
            </label>
          )}
          {!canEditPermissions && hasAdmin && (
            <p className="users-table__popover-line muted">Права администратора</p>
          )}
        </div>
      )}
    </div>
  )
}
