import { ROSTER_MODULES } from '../constants/rosterModules'

/**
 * Заглушка раздела, который ещё не реализован (дежурства, календарь).
 */
export default function ModulePlaceholderPage({ moduleKey }) {
  const mod = ROSTER_MODULES[moduleKey]
  if (!mod) return null

  return (
    <div className="module-placeholder-page">
      <div className="module-placeholder">
        <p className="module-placeholder__title">{mod.title}</p>
        <p className="module-placeholder__hint muted">{mod.description}</p>
      </div>
    </div>
  )
}
