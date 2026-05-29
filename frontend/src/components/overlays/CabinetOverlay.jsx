import RouteModal from '../RouteModal'
import DashboardPanel from '../../panels/DashboardPanel'

export default function CabinetOverlay() {
  return (
    <RouteModal title="Личный кабинет" size="wide">
      <DashboardPanel />
    </RouteModal>
  )
}
