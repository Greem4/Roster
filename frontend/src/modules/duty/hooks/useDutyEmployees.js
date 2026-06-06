import { useCallback, useEffect, useState } from 'react'
import {
  loadEmployees,
  nextEmployeeId,
  normalizeEmployee,
  saveEmployees,
  seedEmployees,
} from '../utils/employeeStorage'

/**
 * Справочник сотрудников ОСМП с сохранением в localStorage.
 */
export function useDutyEmployees() {
  const [employees, setEmployeesState] = useState(loadEmployees)

  const persist = useCallback((next) => {
    const normalized = next.map(normalizeEmployee)
    saveEmployees(normalized)
    setEmployeesState(normalized)
    return normalized
  }, [])

  useEffect(() => {
    const reload = () => setEmployeesState(loadEmployees())
    const onStorage = (event) => {
      if (event.key === null || event.key.includes('roster-duty-employees')) {
        reload()
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('duty-employees-changed', reload)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('duty-employees-changed', reload)
    }
  }, [])

  const updateEmployee = useCallback((id, patch) => {
    setEmployeesState((prev) => {
      const next = prev.map((employee) => (
        employee.id === id ? normalizeEmployee({ ...employee, ...patch }) : employee
      ))
      saveEmployees(next)
      return next
    })
  }, [])

  const addEmployee = useCallback(({ name, role, gender }) => {
    let created = null
    setEmployeesState((prev) => {
      const next = [
        ...prev,
        normalizeEmployee({
          id: nextEmployeeId(prev),
          name,
          role,
          gender,
        }),
      ]
      saveEmployees(next)
      created = next[next.length - 1]
      return next
    })
    return created
  }, [])

  const removeEmployee = useCallback((id) => {
    setEmployeesState((prev) => {
      const next = prev.filter((employee) => employee.id !== id)
      saveEmployees(next)
      return next
    })
  }, [])

  const resetToSeed = useCallback(() => {
    persist(seedEmployees())
  }, [persist])

  return {
    employees,
    updateEmployee,
    addEmployee,
    removeEmployee,
    resetToSeed,
  }
}
