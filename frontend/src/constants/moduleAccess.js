/**
 * Доступ к разделам Roster по правам.
 * RX — публичный; Duty, CA и Pay — только с выданным правом (основатель и супер-админ видят всё).
 */

import { PERM_CA_VIEW } from '../modules/ca/constants'
import { PERM_DUTY_VIEW } from '../modules/duty/constants'
import { PERM_PAY_VIEW } from '../modules/pay/constants'

/** Подписи модульных прав в UI (роль «Сотрудник» = общий график Duty). */
export const MODULE_PERMISSION_LABELS = {
  [PERM_DUTY_VIEW]: 'Сотрудник',
  [PERM_CA_VIEW]: 'CA',
  [PERM_PAY_VIEW]: 'Pay',
}

/** Порядок модульных меток в составной подписи роли. */
export const MODULE_PERMISSION_ORDER = [PERM_DUTY_VIEW, PERM_CA_VIEW, PERM_PAY_VIEW]

export const MODULE_ACCESS = {
  rx: { public: true },
  duty: { permission: PERM_DUTY_VIEW, requiresAuth: true },
  ca: { permission: PERM_CA_VIEW, requiresAuth: true },
  pay: { permission: PERM_PAY_VIEW, requiresAuth: true },
}

/**
 * Может ли пользователь открыть раздел (навигация и маршруты).
 * @param {'duty'|'ca'|'pay'|'rx'} moduleKey
 */
export function canAccessModule(moduleKey, auth) {
  const rule = MODULE_ACCESS[moduleKey]
  if (!rule) return false
  if (rule.public) return true

  const { user, isAuthenticated, hasPermission } = auth
  if (!isAuthenticated || !user) return false
  if (!user.is_active && !user.is_superadmin && !user.is_founder) return false
  return hasPermission(rule.permission)
}

/** Модульные права пользователя для отображения и редактирования. */
export function userModulePermissions(user) {
  if (!user?.permissions) return []
  return MODULE_PERMISSION_ORDER.filter((code) => user.permissions.includes(code))
}

/** Права модулей, доступные для назначения в кабинете (без pay:manage). */
export const ASSIGNABLE_MODULE_PERMISSIONS = MODULE_PERMISSION_ORDER
