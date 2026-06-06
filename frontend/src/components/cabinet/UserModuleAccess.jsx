import {
  ASSIGNABLE_MODULE_PERMISSIONS,
  MODULE_PERMISSION_LABELS,
} from '../../constants/moduleAccess'

/**
 * Переключатели модульных прав: Сотрудник (Duty), CA, Pay.
 * Комбинируются с ролью: «Администратор · Сотрудник» и т.п.
 */
export default function UserModuleAccess({ user, editable, onToggle }) {
  if (user.is_founder || user.is_superadmin) {
    return <span className="muted users-table__modules-all">Все разделы</span>
  }

  return (
    <div className="users-table__modules" role="group" aria-label="Доступ к разделам">
      {ASSIGNABLE_MODULE_PERMISSIONS.map((code) => {
        const checked = user.permissions.includes(code)
        return (
          <label
            key={code}
            className={[
              'users-table__module-chip',
              checked ? 'users-table__module-chip--on' : null,
            ]
              .filter(Boolean)
              .join(' ')}
            title={MODULE_PERMISSION_LABELS[code]}
          >
            <input
              type="checkbox"
              className="users-table__module-input"
              checked={checked}
              disabled={!editable}
              onChange={() => onToggle(user.id, code)}
            />
            {MODULE_PERMISSION_LABELS[code]}
          </label>
        )
      })}
    </div>
  )
}
