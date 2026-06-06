/** Подписи и стили ролей (совпадают с backend app.roles). */

import {
  MODULE_PERMISSION_LABELS,
  userModulePermissions,
} from '../constants/moduleAccess'

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

/**
 * Составная подпись: «Администратор · Сотрудник · Pay».
 * Основатель и супер-админ — без доп. меток (им и так доступно всё).
 */
export function userDisplayLabel(user) {
  if (!user) return ROLE_LABELS.user
  const base = roleLabel(userEffectiveRole(user))
  if (user.is_founder || user.is_superadmin) return base
  const extras = userModulePermissions(user).map((code) => MODULE_PERMISSION_LABELS[code])
  if (extras.length === 0) return base
  return `${base} · ${extras.join(' · ')}`
}

export function roleBadgeClass(role) {
  return ROLE_BADGE_CLASS[role] ?? ROLE_BADGE_CLASS.user
}

/** Классы плашки роли в таблице пользователей (badge + цвет роли). */
export function roleTablePillClass(role) {
  return `users-table__role-pill badge ${roleBadgeClass(role)}`
}
