import { Navigate, useParams } from 'react-router-dom'

export default function MedicineEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`/medicines?edit=${id}`} replace />
}
