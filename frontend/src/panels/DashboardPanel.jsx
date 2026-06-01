import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import ChangePasswordForm from '../components/cabinet/ChangePasswordForm'
import PromoteFounderBlock from '../components/cabinet/PromoteFounderBlock'
import RoleBadge from '../components/cabinet/RoleBadge'
import YandexLoginButton from '../components/YandexLoginButton'
import { useAuth } from '../context/AuthContext'

function urgencyClass(days) {
  if (days < 0) return 'badge-danger'
  if (days <= 7) return 'badge-danger'
  if (days <= 14) return 'badge-warn'
  return 'badge-ok'
}

/** Личный кабинет: профиль, безопасность, роли, алерты. */
export default function DashboardPanel() {
  const { isAdmin, canManageUsers, user } = useAuth()
  const [alerts, setAlerts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.alerts
      .expiring()
      .then(setAlerts)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="dashboard-panel cabinet">
      <header className="cabinet-profile">
        {user?.avatar_url ? (
          <img className="cabinet-profile__avatar" src={user.avatar_url} alt="" width={72} height={72} />
        ) : (
          <div className="cabinet-profile__avatar cabinet-profile__avatar--placeholder" aria-hidden />
        )}
        <div className="cabinet-profile__main">
          <h2 className="cabinet-profile__name">{user?.username}</h2>
          <div className="cabinet-profile__meta">
            <RoleBadge role={user?.role} />
            {!user?.is_active && !user?.is_founder && !user?.is_superadmin && (
              <span className="badge badge-warn">ожидает активации</span>
            )}
          </div>
          {user?.email && <p className="muted cabinet-profile__email">{user.email}</p>}
        </div>
      </header>

      <section className="cabinet-section">
        <h3 className="section-title">Безопасность</h3>
        <ChangePasswordForm />
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

      <PromoteFounderBlock />

      <section className="cabinet-section">
        <div className="section-header">
          <h3 className="section-title">Скоро истекает срок годности</h3>
          {alerts && (
            <span className={`badge ${alerts.total > 0 ? 'badge-warn' : 'badge-ok'}`}>
              {alerts.total}
            </span>
          )}
        </div>
        {error && <p className="error">{error}</p>}
        {!alerts && !error && <p className="muted">Загрузка…</p>}
        {alerts && alerts.total === 0 && (
          <p className="muted">Нет позиций в зоне предупреждения.</p>
        )}
        {alerts && alerts.total > 0 && (
          <ul className="alert-list">
            {alerts.items.slice(0, 10).map((item) => (
              <li key={item.id} className="alert-item">
                <strong>{item.name}</strong> — серия {item.series}, срок {item.expiry_date}
                <span className={`badge ${urgencyClass(item.days_until_expiry)}`}>
                  {item.days_until_expiry} дн.
                </span>
              </li>
            ))}
          </ul>
        )}
        {alerts && alerts.total > 10 && (
          <p className="muted">И ещё {alerts.total - 10} позиций…</p>
        )}
      </section>

      <div className="quick-links">
        {isAdmin && (
          <Link to="/medicines?add=1" className="btn-primary link-btn">
            Добавить лекарство
          </Link>
        )}
        {canManageUsers && (
          <Link to="/admin/users" className="btn-secondary link-btn">
            Управление пользователями
          </Link>
        )}
      </div>
    </div>
  )
}
