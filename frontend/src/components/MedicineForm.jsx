import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function MedicineForm({ medicineId, onSuccess, onCancel }) {
  const isEdit = medicineId != null
  const [name, setName] = useState('')
  const [series, setSeries] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    api.medicines
      .get(medicineId)
      .then((m) => {
        setName(m.name)
        setSeries(m.series)
        setExpiryDate(m.expiry_date)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [medicineId, isEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const body = { name, series, expiry_date: expiryDate }
    try {
      if (isEdit) {
        await api.medicines.update(medicineId, body)
      } else {
        await api.medicines.create(body)
      }
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="muted">Загрузка…</p>
  }

  return (
    <form className="medicine-form" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <label>
        Название
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
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
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  )
}
