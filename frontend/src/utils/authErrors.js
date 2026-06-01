/** Сообщения API входа/OAuth на русском (запасной маппинг для старых ответов). */
const LOGIN_ERROR_MAP = {
  'Invalid credentials': 'Неверный логин или пароль',
  'Account pending approval': 'Аккаунт ожидает подтверждения администратором',
}

/**
 * Текст ошибки авторизации для показа пользователю.
 * @param {string} [message]
 * @returns {string}
 */
export function formatAuthError(message) {
  if (!message) return ''
  return LOGIN_ERROR_MAP[message] ?? message
}
