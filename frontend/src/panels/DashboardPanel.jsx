import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

function urgencyClass(days) {
  if (days < 0) return 'badge-danger'
  if (days <= 7) return 'badge-danger'
  if (days <= 14) return 'badge-warn'
  return 'badge-ok'
}

/** Содержимое личного кабинета: алерты и быстрые действия. */
export default function DashboardPanel() {
  const { isAdmin, hasPermission, user } = useAuth()
  const [alerts, setAlerts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.alerts
      .expiring()
      .then(setAlerts)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="dashboard-panel">
      <p className="muted dashboard-greeting">Добро пожаловать, {user?.username}</p>

      <section className="section">
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
        {hasPermission('users:manage') && (
          <Link to="/admin/users" className="btn-secondary link-btn">
            Управление пользователями
          </Link>
        )}
      </div>
    </div>
  )
}
