import { useNavigate } from 'react-router-dom'
import ChangePasswordForm from '../components/cabinet/ChangePasswordForm'
import PromoteFounderBlock from '../components/cabinet/PromoteFounderBlock'
import YandexLoginButton from '../components/YandexLoginButton'
import { RX_HOME } from '../constants/routes'
import { useAuth } from '../context/AuthContext'

/** Настройки аккаунта: пароль, привязка Яндекс ID, выход, назначение основателя. */
export default function CabinetSettingsPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(RX_HOME)
  }

  return (
    <div className="cabinet-panel">
      <section className="cabinet-section">
        <h2 className="cabinet-section__title">Пароль</h2>
        <p className="muted cabinet-section__lead">
          {user?.has_password
            ? 'Смените пароль для входа по логину.'
            : 'Задайте пароль, если хотите входить без Яндекс ID.'}
        </p>
        <ChangePasswordForm />
      </section>

      <section className="cabinet-section">
        <h2 className="cabinet-section__title">Вход через Яндекс</h2>
        <div className="cabinet-yandex">
          <p className="muted">
            {user?.yandex_linked
              ? 'Яндекс ID привязан — можно входить через кнопку на странице входа.'
              : 'Привяжите Яндекс ID для входа без пароля.'}
          </p>
          {!user?.yandex_linked && (
            <YandexLoginButton mode="login" onSuccess={() => window.location.reload()} />
          )}
        </div>
      </section>

      <section className="cabinet-section cabinet-section--danger">
        <h2 className="cabinet-section__title">Сеанс</h2>
        <button type="button" className="btn-secondary" onClick={handleLogout}>
          Выйти из аккаунта
        </button>
      </section>

      <PromoteFounderBlock />
    </div>
  )
}
