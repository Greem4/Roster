/**
 * Разделы приложения в шапке: дежурства, финансы, средства (RX).
 * Переключаются маршрутами /duty, /pay, /medicines.
 */
export const ROSTER_MODULES = {
  duty: {
    key: 'duty',
    path: '/duty',
    suffix: 'Duty',
    title: 'RosterDuty',
    description: 'График дежурств и смен — в разработке.',
  },
  pay: {
    key: 'pay',
    path: '/pay',
    suffix: 'Pay',
    title: 'RosterPay',
    description: 'Учёт денег и выплат — в разработке.',
  },
  rx: {
    key: 'rx',
    path: '/medicines',
    suffix: 'RX',
    title: 'RosterRX',
    description: 'Реестр и сводка по средствам.',
  },
}

/** Порядок вкладок слева направо в шапке. */
export const ROSTER_MODULE_ORDER = ['duty', 'pay', 'rx']
