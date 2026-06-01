/** Подписи и стили ролей (совпадают с backend app.roles). */

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

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? ROLE_LABELS.user
}

export function roleBadgeClass(role) {
  return ROLE_BADGE_CLASS[role] ?? ROLE_BADGE_CLASS.user
}
