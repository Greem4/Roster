import { useState } from 'react'
import { Link } from 'react-router-dom'
import RegisterForm from '../RegisterForm'
import RouteModal from '../RouteModal'

export default function RegisterOverlay() {
  const [success, setSuccess] = useState(false)

  if (success) {
    return (
      <RouteModal title="Заявка отправлена">
        <p>Дождитесь одобрения администратора, затем войдите в систему.</p>
        <Link to="/login" className="btn-primary link-btn">
          На страницу входа
        </Link>
      </RouteModal>
    )
  }

  return (
    <RouteModal title="Регистрация">
      <RegisterForm onSuccess={() => setSuccess(true)} />
    </RouteModal>
  )
}
