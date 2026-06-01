import { roleBadgeClass, roleLabel } from '../../utils/userRole'

/** Плашка роли пользователя. */
export default function RoleBadge({ role }) {
  if (!role) return null
  return (
    <span className={`badge ${roleBadgeClass(role)}`} title={roleLabel(role)}>
      {roleLabel(role)}
    </span>
  )
}
