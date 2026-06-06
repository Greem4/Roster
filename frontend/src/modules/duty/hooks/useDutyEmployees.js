import { useCallback, useEffect, useState } from 'react'
import { dutyApi } from '../api'
import { normalizeEmployee } from '../utils/employeeStorage'

/**
 * Справочник сотрудников ОСМП — загрузка и изменения через API (/duty).
 */
export function useDutyEmployees() {
  const [employees, setEmployeesState] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await dutyApi.listEmployees()
      setEmployeesState(rows.map(normalizeEmployee))
    } catch (err) {
      setError(err.message || 'Не удалось загрузить справочник ОСМП')
      setEmployeesState([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const updateEmployee = useCallback(async (id, patch) => {
    const updated = await dutyApi.patchEmployee(id, patch)
    const normalized = normalizeEmployee(updated)
    setEmployeesState((prev) => prev.map((employee) => (
      employee.id === id ? normalized : employee
    )))
    return normalized
  }, [])

  const addEmployee = useCallback(async ({ name, title, gender }) => {
    const created = await dutyApi.createEmployee({ name, title, gender: gender || null })
    const normalized = normalizeEmployee(created)
    setEmployeesState((prev) => [...prev, normalized])
    return normalized
  }, [])

  const removeEmployee = useCallback(async (id) => {
    await dutyApi.deleteEmployee(id)
    setEmployeesState((prev) => prev.filter((employee) => employee.id !== id))
  }, [])

  return {
    employees,
    loading,
    error,
    reload,
    updateEmployee,
    addEmployee,
    removeEmployee,
  }
}
