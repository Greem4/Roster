import { Navigate, useParams } from 'react-router-dom'
import { RX_HOME } from '../../../constants/routes'

export default function MedicineEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`${RX_HOME}?edit=${id}`} replace />
}
