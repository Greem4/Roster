import RouteModal from '../RouteModal'
import AdminUsersPanel from '../../panels/AdminUsersPanel'

export default function AdminUsersOverlay() {
  return (
    <RouteModal title="Пользователи" size="wide">
      <AdminUsersPanel />
    </RouteModal>
  )
}
