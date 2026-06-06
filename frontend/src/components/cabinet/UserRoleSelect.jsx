import {
  assignableRoles,
  roleLabel,
  roleTablePillClass,
  userDisplayLabel,
  userEffectiveRole,
} from '../../utils/userRole'

/**
 * Выбор роли в строке таблицы пользователей.
 * Список опций зависит от роли того, кто редактирует (см. assignableRoles).
 */
export default function UserRoleSelect({ user, current, onSetRole }) {
  const role = userEffectiveRole(user)
  const options = assignableRoles(current, user)

  if (options.length === 0) {
    return <span className={roleTablePillClass(role)}>{userDisplayLabel(user)}</span>
  }

  const selectValue = options.includes(role) ? role : options[0]

  return (
    <select
      className={`users-table__role-select ${roleTablePillClass(selectValue)}`}
      value={selectValue}
      aria-label="Роль"
      onChange={(e) => onSetRole(user.id, e.target.value)}
    >
      {options.map((r) => (
        <option key={r} value={r}>
          {roleLabel(r)}
        </option>
      ))}
    </select>
  )
}
