/**
 * Маркеры лекарственной формы и способа применения — всё после них в списке не показываем.
 */
const FORM_START =
  /\s+(?:р-р|р\/р|р\.\s*р\.?|раствор|таб\.?|таблетк|табл\.?|к-та|капс\.?|кап\.?|капли|настойка|н-ка|сироп|мазь|крем|гель|свечи|амп\.?|сусп\.?|пор\.?|конц\.?|спрей|кап\.?\s+наз\.|д\/|для\s+(?:в\/|приема|мест|нар|инъек))/i

/** Дозировка и объём после торгового наименования (например «Мелоксикам 10мг/мл …»). */
const DOSAGE_START = /\s+\d+[.,]?\d*\s*(?:мг|мл|мг\/мл|г|%|доз)/i

/**
 * Краткое наименование для таблицы на телефоне: торговое имя без формы, дозировки и фасовки.
 * Полная строка остаётся в подсказке (title).
 */
export function shortMedicineName(name) {
  if (!name || typeof name !== 'string') return ''
  let s = name.trim()
  const comma = s.indexOf(',')
  if (comma > 0) s = s.slice(0, comma).trim()

  const formMatch = s.match(FORM_START)
  if (formMatch && formMatch.index > 0) {
    s = s.slice(0, formMatch.index).trim()
  }

  const doseMatch = s.match(DOSAGE_START)
  if (doseMatch && doseMatch.index > 0) {
    s = s.slice(0, doseMatch.index).trim()
  }

  return s || name.trim()
}
