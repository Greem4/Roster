import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ title, onClose, children, size, alignTop = false }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const panelClass = [
    'modal-panel',
    size === 'medium' && 'modal-panel--medium',
    size === 'wide' && 'modal-panel--wide',
    size === 'auth' && 'modal-panel--auth',
  ]
    .filter(Boolean)
    .join(' ')

  return createPortal(
    <div
      className={[
        'modal-backdrop',
        size === 'auth' && 'modal-backdrop--auth',
        alignTop && 'modal-backdrop--align-top',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
