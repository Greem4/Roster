import { useNavigate } from 'react-router-dom'
import Modal from './Modal'

/**
 * Модальное окно, привязанное к маршруту: закрытие возвращает на список лекарств.
 */
export default function RouteModal({ title, children, size }) {
  const navigate = useNavigate()
  return (
    <Modal title={title} onClose={() => navigate('/medicines')} size={size}>
      {children}
    </Modal>
  )
}
