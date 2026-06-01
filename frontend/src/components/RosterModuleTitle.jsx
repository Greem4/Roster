import { ROSTER_MODULES } from '../constants/rosterModules'

/**
 * Заголовок раздела: «Roster» + цветной суффикс (Duty / Pay / RX), как в шапке.
 *
 * @param {'h1'|'h2'|'p'|'span'} [as] — HTML-тег обёртки
 * @param {keyof typeof ROSTER_MODULES} moduleKey
 * @param {string} [className] — дополнительные классы (размер, отступы страницы)
 */
export default function RosterModuleTitle({ moduleKey, as: Tag = 'h1', className }) {
  const mod = ROSTER_MODULES[moduleKey]
  if (!mod) return null

  return (
    <Tag className={['roster-module-title', className].filter(Boolean).join(' ')}>
      Roster
      <span className={`roster-module-title__suffix roster-module-title__suffix--${moduleKey}`}>
        {mod.suffix}
      </span>
    </Tag>
  )
}
