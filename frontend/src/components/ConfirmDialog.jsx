import Modal from './Modal'

/**
 * Диалог подтверждения необратимого действия (удаление и т.п.).
 * @param {{
 *   title: string,
 *   message: import('react').ReactNode,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   confirming?: boolean,
 *   danger?: boolean,
 *   onConfirm: () => void,
 *   onClose: () => void,
 * }} props
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  confirming = false,
  danger = true,
  onConfirm,
  onClose,
}) {
  const handleClose = () => {
    if (!confirming) onClose()
  }

  return (
    <Modal title={title} onClose={handleClose}>
      <div className="confirm-dialog">
        <p className="confirm-dialog-message">{message}</p>
        <div className="form-actions confirm-dialog-actions">
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={confirming}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'Удаление…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
