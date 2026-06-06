import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RoleBadge from '../components/cabinet/RoleBadge'
import { RX_HOME } from '../constants/routes'
import { useAuth } from '../context/AuthContext'
import { rxApi } from '../modules/rx/api'
import { expiryTier } from '../modules/rx/utils/expiryTier'
import { shortMedicineName } from '../modules/rx/utils/medicineName'
import { formatDate } from '../utils/formatDate'
import '../modules/rx/rx.css'

function urgencyClass(days) {
  if (days < 0) return 'badge-danger'
  if (days <= 7) return 'badge-danger'
  if (days <= 14) return 'badge-warn'
  return 'badge-ok'
}

/** Позиция в блоке предупреждений: название и серия слева, срок и «дн.» — одной колонкой справа. */
function AlertMedicineItem({ item }) {
  const tier = expiryTier(item.days_until_expiry)
  return (
    <li className={`medicine-item medicine-item--${tier}`}>
      <span className="medicine-item-name" title={item.name}>
        {shortMedicineName(item.name)}
      </span>
      <span className="medicine-item-series">{item.series}</span>
      <div className="medicine-item-expiry">
        <time className="medicine-item-date" dateTime={item.expiry_date}>
          {formatDate(item.expiry_date)}
        </time>
        <span className={`badge medicine-item-badge ${urgencyClass(item.days_until_expiry)}`}>
          {item.days_until_expiry} дн.
        </span>
      </div>
    </li>
  )
}

/** Обзор кабинета: профиль и предупреждения по срокам годности. */
export default function CabinetOverviewPanel() {
  const { isAdmin, canManageUsers, user } = useAuth()
  const [alerts, setAlerts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    rxApi.alerts
      .expiring()
      .then(setAlerts)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="cabinet-panel">
      <header className="cabinet-profile">
        {user?.avatar_url ? (
          <img
            className="cabinet-profile__avatar"
            src={user.avatar_url}
            alt=""
            width={72}
            height={72}
          />
        ) : (
          <div
            className="cabinet-profile__avatar cabinet-profile__avatar--placeholder"
            aria-hidden
          />
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
        <div className="section-header">
          <h2 className="cabinet-section__title">Скоро истекает срок годности</h2>
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
          <ul className="medicines-list" aria-label="Скоро истекает срок годности">
            {alerts.items.slice(0, 10).map((item) => (
              <AlertMedicineItem key={item.id} item={item} />
            ))}
          </ul>
        )}
        {alerts && alerts.total > 10 && (
          <p className="muted">
            И ещё {alerts.total - 10} позиций.{' '}
            <Link to={RX_HOME}>Открыть список лекарств</Link>
          </p>
        )}
        {alerts && alerts.total > 0 && alerts.total <= 10 && (
          <p className="muted cabinet-section__footer">
            <Link to={RX_HOME}>Список лекарств</Link>
          </p>
        )}
      </section>

      <div className="quick-links">
        {isAdmin && (
          <Link to={`${RX_HOME}?add=1`} className="btn-primary link-btn">
            Добавить лекарство
          </Link>
        )}
        {canManageUsers && (
          <Link to="/cabinet/users" className="btn-secondary link-btn">
            Управление пользователями
          </Link>
        )}
        <Link to="/cabinet/settings" className="btn-secondary link-btn">
          Настройки аккаунта
        </Link>
      </div>
    </div>
  )
}
