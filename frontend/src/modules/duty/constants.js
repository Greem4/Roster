/** Метка смены: бригада. */
export const DUTY_MARK_BRIGADE = 'Б'

/** Право на общий график дежурств (синхронно с backend). */
export const PERM_DUTY_VIEW = 'duty:view'

/** Метка смены: телефоны. */
export const DUTY_MARK_PHONE = 'О'

/** Цикл переключения ячейки при клике. */
export const DUTY_MARK_CYCLE = ['', DUTY_MARK_BRIGADE, DUTY_MARK_PHONE]

/** Подписи ролей сотрудников в графике. */
export const DUTY_ROLE_LABELS = {
  doctor: 'Врач',
  nurse: 'Медсестра',
  paramedic: 'Фельдшер',
}

/**
 * Сотрудники ОСМП в порядке строк бумажного графика.
 * Первые пять — врачи, далее медсестры, Зеленкин — фельдшер (строка 7).
 */
export const DUTY_EMPLOYEES = [
  { id: 1, name: 'Васильева Е.С.', role: 'doctor' },
  { id: 2, name: 'Дивинский Н.В.', role: 'doctor' },
  { id: 3, name: 'Корнева Т.И.', role: 'doctor' },
  { id: 4, name: 'Красницкий Я.И.', role: 'doctor' },
  { id: 5, name: 'Яшин В.А.', role: 'doctor' },
  { id: 6, name: 'Белялов С.В.', role: 'nurse' },
  { id: 7, name: 'Зеленкин С.Е.', role: 'paramedic', isSelf: true },
  { id: 8, name: 'Иванова Е.С.', role: 'nurse' },
  { id: 9, name: 'Кочулаева Н.Е.', role: 'nurse' },
  { id: 10, name: 'Левина Л.Г.', role: 'nurse' },
  { id: 11, name: 'Суркова С.А.', role: 'nurse' },
  { id: 12, name: 'Силин А.Ю.', role: 'nurse' },
  { id: 13, name: 'Толпинская Г.А.', role: 'nurse' },
  { id: 14, name: 'Фомина Н.П.', role: 'nurse' },
]
