import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import MedicineForm from '../components/MedicineForm'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { shortMedicineName } from '../utils/medicineName'

const MONTH_DAYS = 30
const TWO_MONTHS_DAYS = 60

function expiryRowClass(days) {
  if (days < MONTH_DAYS) return 'row-danger'
  if (days <= TWO_MONTHS_DAYS) return 'row-warn'
  return 'row-ok'
}

function expiryStatus(days) {
  if (days < 0) {
    return { text: 'Просрочено', badge: 'badge-danger' }
  }
  const text = `${days} дн.`
  if (days < MONTH_DAYS) return { text, badge: 'badge-danger' }
  if (days <= TWO_MONTHS_DAYS) return { text, badge: 'badge-warn' }
  return { text, badge: 'badge-ok' }
}

function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Компактная дата для узкого экрана. */
function formatDateShort(iso) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const SORT_OPTIONS = [
  { key: 'name', label: 'Название' },
  { key: 'series', label: 'Серия' },
  { key: 'expiry_date', label: 'Срок' },
  { key: 'days_until_expiry', label: 'Осталось' },
]

function compareItems(a, b, key, dir) {
  const mul = dir === 'asc' ? 1 : -1
  let va
  let vb
  switch (key) {
    case 'name':
      va = a.name.toLocaleLowerCase('ru')
      vb = b.name.toLocaleLowerCase('ru')
      break
    case 'series':
      va = a.series.toLocaleLowerCase('ru')
      vb = b.series.toLocaleLowerCase('ru')
      break
    case 'expiry_date':
      va = a.expiry_date
      vb = b.expiry_date
      break
    case 'days_until_expiry':
      va = a.days_until_expiry
      vb = b.days_until_expiry
      break
    default:
      return 0
  }
  if (va < vb) return -1 * mul
  if (va > vb) return 1 * mul
  return 0
}

function SortHeader({ label, sortKey, activeKey, dir, onSort }) {
  const active = activeKey === sortKey
  return (
    <th>
      <button
        type="button"
        className={`th-sort${active ? ' th-sort-active' : ''}`}
        onClick={() => onSort(sortKey)}
      >
        {label}
        <span className="th-sort-icon" aria-hidden>
          {active ? (dir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </button>
    </th>
  )
}

export default function MedicinesPage() {
  const { isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState('expiry_date')
  const [sortDir, setSortDir] = useState('asc')
  const [modal, setModal] = useState(null)

  const closeModal = () => setModal(null)

  const openCreate = () => setModal({ mode: 'create' })

  const openEdit = (id) => setModal({ mode: 'edit', id })

  const load = (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    api.medicines
      .list()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => {
        if (showSpinner) setLoading(false)
      })
  }

  const handleFormSuccess = () => {
    closeModal()
    load(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    const add = searchParams.get('add')
    const editId = searchParams.get('edit')
    if (add != null) {
      openCreate()
      setSearchParams({}, { replace: true })
    } else if (editId) {
      openEdit(Number(editId))
      setSearchParams({}, { replace: true })
    }
  }, [isAdmin, searchParams, setSearchParams])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => compareItems(a, b, sortKey, sortDir)),
    [items, sortKey, sortDir],
  )

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
    <div className="medicines-page">
      <div className="page-header medicines-page-header">
        <h1>Лекарства</h1>
        {isAdmin && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            Добавить
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {loading && <p>Загрузка…</p>}
      {!loading && (
        <div className="card medicines-card">
          <div className="expiry-legend" aria-label="Подсветка по сроку годности">
            <span className="legend-item">
              <span className="legend-swatch legend-swatch-danger" />
              <span className="legend-text">&lt; 1 мес</span>
            </span>
            <span className="legend-item">
              <span className="legend-swatch legend-swatch-warn" />
              <span className="legend-text">1–2 мес</span>
            </span>
            <span className="legend-item">
              <span className="legend-swatch legend-swatch-ok" />
              <span className="legend-text">&gt; 2 мес</span>
            </span>
          </div>
          <div className="medicines-sort-mobile" role="toolbar" aria-label="Сортировка">
            {SORT_OPTIONS.map(({ key, label }) => {
              const active = sortKey === key
              return (
                <button
                  key={key}
                  type="button"
                  className={`sort-chip${active ? ' sort-chip-active' : ''}`}
                  onClick={() => handleSort(key)}
                >
                  {label}
                  {active && (
                    <span className="sort-chip-dir" aria-hidden>
                      {sortDir === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="table-wrap medicines-table-wrap">
            <table className="data-table medicines-table">
              <thead>
                <tr>
                  <SortHeader
                    label="Название"
                    sortKey="name"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Серия"
                    sortKey="series"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Срок годности"
                    sortKey="expiry_date"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Осталось"
                    sortKey="days_until_expiry"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  {isAdmin && <th className="th-actions">Действия</th>}
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((m) => {
                  const status = expiryStatus(m.days_until_expiry)
                  const displayName = shortMedicineName(m.name)
                  return (
                    <tr key={m.id} className={expiryRowClass(m.days_until_expiry)}>
                      <td className="cell-name">
                        <div className="medicine-name-row">
                          <span className="medicine-name-short" title={m.name}>
                            {displayName}
                          </span>
                          <span className={`badge medicine-days-mobile ${status.badge}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="medicine-meta-mobile">
                          <span className="medicine-series-mobile">сер. {m.series}</span>
                          <span className="medicine-expiry-mobile">
                            до {formatDateShort(m.expiry_date)}
                          </span>
                        </div>
                        {isAdmin && (
                          <div className="medicine-actions-mobile">
                            <button type="button" className="link-btn-plain" onClick={() => openEdit(m.id)}>
                              Изменить
                            </button>
                            <button
                              type="button"
                              className="link-danger"
                              onClick={() => handleDelete(m.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="cell-series">{m.series}</td>
                      <td className="cell-date">{formatDate(m.expiry_date)}</td>
                      <td className="cell-days">
                        <span className={`badge ${status.badge}`}>{status.text}</span>
                      </td>
                      {isAdmin && (
                        <td className="actions cell-actions-desktop">
                          <button type="button" className="link-btn-plain" onClick={() => openEdit(m.id)}>
                            Изменить
                          </button>
                          <button
                            type="button"
                            className="link-danger"
                            onClick={() => handleDelete(m.id)}
                          >
                            Удалить
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {items.length === 0 && <p className="muted table-empty">Список пуст</p>}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Новое лекарство' : 'Редактирование'}
          onClose={closeModal}
        >
          <MedicineForm
            medicineId={modal.mode === 'edit' ? modal.id : undefined}
            onSuccess={handleFormSuccess}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </div>
  )
}
