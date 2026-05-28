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

export default function DashboardPage() {
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
    <div>
      <h1>Личный кабинет</h1>
      <p className="muted">Добро пожаловать, {user?.username}</p>

      <section className="card section">
          <div className="section-header">
            <h2>Скоро истекает срок годности</h2>
            {alerts && (
              <span className={`badge ${alerts.total > 0 ? 'badge-warn' : 'badge-ok'}`}>
                {alerts.total}
              </span>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          {!alerts && !error && <p>Загрузка…</p>}
          {alerts && alerts.total === 0 && <p className="muted">Нет позиций в зоне предупреждения.</p>}
          {alerts && alerts.total > 0 && (
            <ul className="alert-list">
              {alerts.items.slice(0, 10).map((item) => (
                <li key={item.id} className="alert-item">
                  <strong>{item.name}</strong> — серия {item.series},{' '}
                  срок {item.expiry_date}
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
          <Link to="/medicines" className="btn-secondary link-btn">
            Все лекарства
          </Link>
      </section>

      <section className="card section quick-links">
        {isAdmin && (
          <Link to="/medicines/new" className="btn-primary link-btn">
            Добавить лекарство
          </Link>
        )}
        {hasPermission('users:manage') && (
          <Link to="/admin/users" className="btn-secondary link-btn">
            Управление пользователями
          </Link>
        )}
      </section>
    </div>
  )
}
