import { Outlet } from 'react-router-dom'
import MedicinesPage from '../pages/MedicinesPage'

/**
 * Список лекарств всегда на фоне; дочерние маршруты — всплывающие панели поверх.
 */
export default function MedicinesLayout() {
  return (
    <>
      <MedicinesPage />
      <Outlet />
    </>
  )
}
