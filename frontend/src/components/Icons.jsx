/** Иконка редактирования (карандаш). */
export function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Иконка сохранения (дискета с ясным контуром). */
export function IconSave() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M15.2 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.8L15.2 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 3v4a1 1 0 0 0 1 1h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Иконка удаления (корзина с крышкой и полосками). */
export function IconTrash() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
