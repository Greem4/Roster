import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Modal from '../../../components/Modal'
import { useAuth } from '../../../context/AuthContext'
import { IconEdit, IconRestore, IconSort, IconTrash } from '../../../components/Icons'
import { formatDate } from '../../../utils/formatDate'
import { rxApi } from '../api'
import MedicineForm from '../components/MedicineForm'
import { expiryTier } from '../utils/expiryTier'
import { shortMedicineName } from '../utils/medicineName'
import '../rx.css'

const TABS = [
  { id: 'active', label: 'В наличии' },
  { id: 'deleted', label: 'Удалённые' },
]

/** Сортировка одним списком: поле + направление. Выбор запоминается в браузере. */
const SORT_OPTIONS = [
  { value: 'expiry_date:asc', label: 'Срок: сначала ближайший' },
  { value: 'expiry_date:desc', label: 'Срок: сначала дальний' },
  { value: 'name:asc', label: 'Название: А → Я' },
  { value: 'name:desc', label: 'Название: Я → А' },
  { value: 'series:asc', label: 'Серия: по возрастанию' },
  { value: 'series:desc', label: 'Серия: по убыванию' },
]
const SORT_STORAGE_KEY = 'rx.sort'
const DEFAULT_SORT = SORT_OPTIONS[0].value

function readSavedSort() {
  try {
    const saved = localStorage.getItem(SORT_STORAGE_KEY)
    return SORT_OPTIONS.some(({ value }) => value === saved) ? saved : DEFAULT_SORT
  } catch {
    return DEFAULT_SORT
  }
}

function saveSort(value) {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, value)
  } catch {
    /* приватный режим — сортировка просто не запомнится */
  }
}

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
    default:
      return 0
  }
  if (va < vb) return -1 * mul
  if (va > vb) return 1 * mul
  return 0
}

/**
 * Действия строки: при удалении кнопки подтверждения появляются на месте иконок.
 */
function MedicineActions({ id, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!confirming || deleting) return
    const onOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setConfirming(false)
      }
    }
    document.addEventListener('pointerdown', onOutside, true)
    return () => document.removeEventListener('pointerdown', onOutside, true)
  }, [confirming, deleting])

  const startDelete = (e) => {
    e.stopPropagation()
    setConfirming(true)
  }

  const cancelDelete = (e) => {
    e.stopPropagation()
    if (!deleting) setConfirming(false)
  }

  const confirmDelete = async (e) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      await onDelete(id)
      setConfirming(false)
    } catch {
      /* ошибка показывается на странице */
    } finally {
      setDeleting(false)
    }
  }

  if (confirming) {
    return (
      <div
        ref={wrapRef}
        className="medicine-actions medicine-actions--confirm"
        role="group"
        aria-label="Подтвердите удаление"
      >
        <button
          type="button"
          className="btn-inline btn-inline-cancel"
          onClick={cancelDelete}
          disabled={deleting}
        >
          Отмена
        </button>
        <button
          type="button"
          className="btn-inline btn-inline-delete"
          onClick={confirmDelete}
          disabled={deleting}
        >
          {deleting ? 'Удаление…' : 'Удалить'}
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="medicine-actions">
      <button
        type="button"
        className="btn-icon"
        onClick={() => onEdit(id)}
        aria-label="Изменить"
      >
        <IconEdit />
      </button>
      <button
        type="button"
        className="btn-icon btn-icon--danger"
        onClick={startDelete}
        aria-label="Удалить"
      >
        <IconTrash />
      </button>
    </div>
  )
}

/** Действие строки во вкладке «Удалённые»: вернуть позицию в реестр. */
function RestoreAction({ id, onRestore }) {
  const [restoring, setRestoring] = useState(false)

  const restore = async () => {
    setRestoring(true)
    try {
      await onRestore(id)
    } catch {
      /* ошибка показывается на странице */
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="medicine-actions">
      <button
        type="button"
        className="btn-icon btn-icon--restore"
        onClick={restore}
        disabled={restoring}
        aria-label="Восстановить"
        title="Восстановить"
      >
        <IconRestore />
      </button>
    </div>
  )
}

/** Одна строка: название · серия · срок; фон по срочности, удалённые — приглушённые. */
function MedicineItem({ medicine, isAdmin, onEdit, onDelete, onRestore }) {
  const deleted = medicine.deleted_at != null
  const expired = medicine.days_until_expiry < 0
  const tier = deleted ? 'deleted' : expiryTier(medicine.days_until_expiry)
  return (
    <li className={`medicine-item medicine-item--${tier}`}>
      <span className="medicine-item-name" title={medicine.name}>
        {shortMedicineName(medicine.name)}
      </span>
      <span className="medicine-item-series">{medicine.series}</span>
      <time
        className={`medicine-item-date${deleted && expired ? ' medicine-item-date--expired' : ''}`}
        dateTime={medicine.expiry_date}
        title={deleted && expired ? 'Срок годности истёк' : undefined}
      >
        {formatDate(medicine.expiry_date)}
      </time>
      {isAdmin && !deleted && (
        <MedicineActions id={medicine.id} onEdit={onEdit} onDelete={onDelete} />
      )}
      {isAdmin && deleted && <RestoreAction id={medicine.id} onRestore={onRestore} />}
    </li>
  )
}

export default function MedicinesPage() {
  const { isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState('active')
  const [lists, setLists] = useState({ active: [], deleted: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState(readSavedSort)
  // Телефон, как в iOS: страница открывается прокрученной под панель, панель достаётся потягиванием вниз.
  const controlsRef = useRef(null)
  const tuckedRef = useRef(false)
  const [revealed, setRevealed] = useState(false)
  const [sortKey, sortDir] = sort.split(':')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)

  const closeModal = () => setModal(null)
  const openCreate = () => setModal({ mode: 'create' })
  const openEdit = (id) => setModal({ mode: 'edit', id })

  const items = lists[tab]

  const load = (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    Promise.all([rxApi.medicines.list(), rxApi.medicines.list({ deleted: true })])
      .then(([active, deleted]) => setLists({ active, deleted }))
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

  useEffect(() => {
    if (loading || tuckedRef.current || !controlsRef.current) return
    tuckedRef.current = true
    if (!window.matchMedia('(max-width: 640px)').matches || window.scrollY > 0) return
    window.scrollTo({ top: controlsBottom(), behavior: 'instant' })
  }, [loading])

  // Ручка подсвечивается, пока панель над списком видна.
  useEffect(() => {
    const onScroll = () => {
      if (controlsRef.current) setRevealed(window.scrollY < controlsBottom() - 4)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function controlsBottom() {
    return controlsRef.current.getBoundingClientRect().bottom + window.scrollY
  }

  const toggleControls = () => {
    window.scrollTo({ top: revealed ? controlsBottom() : 0, behavior: 'smooth' })
  }

  const filteredItems = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('ru')
    if (!q) return items
    return items.filter((m) => {
      const haystack = [m.name, m.series, formatDate(m.expiry_date), m.expiry_date]
        .join(' ')
        .toLocaleLowerCase('ru')
      return haystack.includes(q)
    })
  }, [items, query])

  const sortedItems = useMemo(
    () => [...filteredItems].sort((a, b) => compareItems(a, b, sortKey, sortDir)),
    [filteredItems, sortKey, sortDir],
  )

  const handleDelete = async (id) => {
    try {
      await rxApi.medicines.delete(id)
      load(false)
    } catch (e) {
      setError(e.message)
      throw e
    }
  }

  const handleRestore = async (id) => {
    try {
      await rxApi.medicines.restore(id)
      load(false)
    } catch (e) {
      setError(e.message)
      throw e
    }
  }

  const isDeletedTab = tab === 'deleted'
  const canAdd = isAdmin && !isDeletedTab
  const showToolbar = canAdd || (!loading && items.length > 0)

  return (
    <div className="medicines-page">
      <div ref={controlsRef} className="rx-controls">
        <div className="rx-tabs-bar">
          <div className="rx-tabs" role="tablist" aria-label="Раздел реестра">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                className={`rx-tabs__tab${tab === id ? ' rx-tabs__tab--active' : ''}`}
                aria-selected={tab === id}
                onClick={() => setTab(id)}
              >
                {label}
                {!loading && <span className="rx-tabs__count">{lists[id].length}</span>}
              </button>
            ))}
          </div>
        </div>

        {showToolbar && (
        <header className="roster-page-toolbar medicines-page__toolbar">
          {!loading && items.length > 0 && (
            <>
              <label
                className={`rx-sort${sort !== DEFAULT_SORT ? ' rx-sort--custom' : ''}`}
                title={SORT_OPTIONS.find(({ value }) => value === sort)?.label}
              >
                <IconSort />
                <span className="visually-hidden">Сортировка</span>
                <select
                  className="rx-sort__select"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value)
                    saveSort(e.target.value)
                  }}
                >
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="medicines-page__search-field">
                <span className="visually-hidden">Поиск</span>
                <input
                  type="search"
                  className="medicines-page__search"
                  placeholder="Поиск…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                  enterKeyHint="search"
                />
              </label>
            </>
          )}
          {canAdd && (
            <button type="button" className="btn-primary roster-page-toolbar__action" onClick={openCreate}>
              Добавить
            </button>
          )}
        </header>
        )}
      </div>

      <button
        type="button"
        className={`rx-grip${revealed ? ' rx-grip--open' : ''}`}
        onClick={toggleControls}
        aria-label={revealed ? 'Скрыть панель' : 'Вкладки, поиск, сортировка'}
      >
        <span className="rx-grip__bar" aria-hidden />
        {!revealed && (isDeletedTab || query) && (
          <span className="rx-grip__state">
            {[isDeletedTab && 'Удалённые', query && `«${query}»`].filter(Boolean).join(' · ')}
          </span>
        )}
      </button>

      {error && <p className="error">{error}</p>}
      {loading && <p className="medicines-loading muted">Загрузка…</p>}

      {!loading && items.length === 0 && (
        <div className="medicines-empty">
          <p className="medicines-empty-title">{isDeletedTab ? 'Удалённых нет' : 'Пока пусто'}</p>
          {isDeletedTab && (
            <p className="medicines-empty-hint muted">
              Удалённые лекарства попадают сюда — их можно найти и восстановить.
            </p>
          )}
        </div>
      )}

      {!loading && items.length > 0 && sortedItems.length === 0 && (
        <p className="medicines-empty-filter muted">Ничего не найдено.</p>
      )}

      {!loading && sortedItems.length > 0 && (
        <ul
          className={`medicines-list${isDeletedTab ? ' medicines-list--deleted' : ''}`}
          aria-label={isDeletedTab ? 'Удалённые лекарства' : 'Список лекарств'}
        >
          {sortedItems.map((m) => (
            <MedicineItem
              key={m.id}
              medicine={m}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
            />
          ))}
        </ul>
      )}

      {canAdd && (
        <button type="button" className="rx-fab" onClick={openCreate} aria-label="Добавить лекарство">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
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
