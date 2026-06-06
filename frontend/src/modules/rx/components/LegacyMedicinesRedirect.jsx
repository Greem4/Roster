import { Navigate, useLocation } from 'react-router-dom'
import { RX_HOME } from '../../../constants/routes'

/** Редirect legacy `/medicines…` → `/rx…` с сохранением query. */
export default function LegacyMedicinesRedirect() {
  const { pathname, search } = useLocation()
  const to = pathname.replace(/^\/medicines/, RX_HOME) + search
  return <Navigate to={to} replace />
}
