/** Ключ localStorage: аватар последнего входа через Яндекс ID (для кнопки входа). */
export const YANDEX_AVATAR_STORAGE_KEY = 'roster_yandex_avatar_url'

export const YANDEX_AVATAR_EVENT = 'roster-yandex-avatar'

/** Прочитать сохранённый URL аватара Яндекса. */
export function getCachedYandexAvatar() {
  try {
    return localStorage.getItem(YANDEX_AVATAR_STORAGE_KEY) || null
  } catch {
    return null
  }
}

/** Сохранить URL аватара и уведомить подписчиков (кнопка «Войти с Яндекс ID»). */
export function setCachedYandexAvatar(url) {
  try {
    if (url) {
      localStorage.setItem(YANDEX_AVATAR_STORAGE_KEY, url)
    } else {
      localStorage.removeItem(YANDEX_AVATAR_STORAGE_KEY)
    }
    window.dispatchEvent(new CustomEvent(YANDEX_AVATAR_EVENT))
  } catch {
    /* private mode / quota */
  }
}
