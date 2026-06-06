import { useNavigate } from 'react-router-dom'
import { RX_HOME } from '../constants/routes'
import Modal from './Modal'

/**
 * Модальное окно, привязанное к маршруту: закрытие переходит на closeTo.
 */
export default function RouteModal({ title, children, size, closeTo = RX_HOME }) {
  const navigate = useNavigate()
  return (
    <Modal title={title} onClose={() => navigate(closeTo)} size={size}>
      {children}
    </Modal>
  )
}
