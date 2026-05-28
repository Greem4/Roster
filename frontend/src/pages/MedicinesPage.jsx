import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

function urgencyClass(days) {
  if (days < 0) return 'row-expired'
  if (days <= 7) return 'row-danger'
  if (days <= 30) return 'row-warn'
  return ''
}

export default function MedicinesPage() {
  const { hasPermission } = useAuth()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.medicines
      .list({ sort: 'expiry_date' })
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить запись?')) return
    try {
      await api.medicines.delete(id)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Лекарства</h1>
        {hasPermission('medicines:edit') && (
          <Link to="/medicines/new" className="btn-primary link-btn">
            Добавить
          </Link>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {loading && <p>Загрузка…</p>}
      {!loading && (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Серия</th>
                <th>Срок годности</th>
                <th>Осталось</th>
                {hasPermission('medicines:edit') && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className={urgencyClass(m.days_until_expiry)}>
                  <td>{m.name}</td>
                  <td>{m.series}</td>
                  <td>{m.expiry_date}</td>
                  <td>{m.days_until_expiry} дн.</td>
                  {hasPermission('medicines:edit') && (
                    <td className="actions">
                      <Link to={`/medicines/${m.id}/edit`}>Изменить</Link>
                      <button type="button" className="link-danger" onClick={() => handleDelete(m.id)}>
                        Удалить
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="muted table-empty">Список пуст</p>}
        </div>
      )}
    </div>
  )
}
