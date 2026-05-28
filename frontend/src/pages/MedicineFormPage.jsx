import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'

export default function MedicineFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [series, setSeries] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    api.medicines
      .get(id)
      .then((m) => {
        setName(m.name)
        setSeries(m.series)
        setExpiryDate(m.expiry_date)
      })
      .catch((e) => setError(e.message))
  }, [id, isEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const body = { name, series, expiry_date: expiryDate }
    try {
      if (isEdit) {
        await api.medicines.update(id, body)
      } else {
        await api.medicines.create(body)
      }
      navigate('/medicines')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1>{isEdit ? 'Редактирование' : 'Новое лекарство'}</h1>
      <form className="card form-card" onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}
        <label>
          Название
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Серия
          <input value={series} onChange={(e) => setSeries(e.target.value)} required />
        </label>
        <label>
          Срок годности
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Сохранение…' : 'Сохранить'}
          </button>
          <Link to="/medicines" className="btn-secondary link-btn">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  )
}
