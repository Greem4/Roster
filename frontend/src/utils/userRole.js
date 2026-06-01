/** Подписи и стили ролей (совпадают с backend app.roles). */

export const PERM_MANAGE = 'users:manage'

export const ROLE_LABELS = {
  founder: 'Основатель',
  superadmin: 'Супер-админ',
  admin: 'Администратор',
  user: 'Пользователь',
}

export const ROLE_BADGE_CLASS = {
  founder: 'badge-role-founder',
  superadmin: 'badge-role-superadmin',
  admin: 'badge-role-admin',
  user: 'badge-role-user',
}

/** Текущая роль пользователя для UI и API. */
export function userEffectiveRole(user) {
  if (!user) return 'user'
  if (user.is_founder) return 'founder'
  if (user.is_superadmin) return 'superadmin'
  if (user.permissions?.includes(PERM_MANAGE)) return 'admin'
  return 'user'
}

/**
 * Роли, которые текущий пользователь может назначить целевому (без основателя).
 * Зеркало backend roles_actor_may_assign + can_manage_user.
 */
export function assignableRoles(current, target) {
  if (!current || !target || current.id === target.id) return []
  if (target.is_founder) return []

  if (current.is_founder) {
    return ['superadmin', 'admin', 'user']
  }
  if (current.is_superadmin) {
    if (target.is_superadmin) return []
    return ['admin', 'user']
  }
  if (current.permissions?.includes(PERM_MANAGE)) {
    if (target.is_superadmin || target.is_founder) return []
    return ['admin', 'user']
  }
  return []
}

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? ROLE_LABELS.user
}

export function roleBadgeClass(role) {
  return ROLE_BADGE_CLASS[role] ?? ROLE_BADGE_CLASS.user
}

/** Классы плашки роли в таблице пользователей (badge + цвет роли). */
export function roleTablePillClass(role) {
  return `users-table__role-pill badge ${roleBadgeClass(role)}`
}
