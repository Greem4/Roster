/**
 * Разделы приложения в шапке: дежурства, календарь (CA), финансы, средства (RX).
 * Переключаются маршрутами /duty, /ca, /pay, /medicines.
 */
export const ROSTER_MODULES = {
  duty: {
    key: 'duty',
    path: '/duty',
    suffix: 'Duty',
    title: 'RosterDuty',
    description: 'График дежурств и смен — в разработке.',
  },
  ca: {
    key: 'ca',
    path: '/ca',
    suffix: 'CA',
    title: 'RosterCA',
    description: 'Календарь — в разработке.',
  },
  pay: {
    key: 'pay',
    path: '/pay',
    suffix: 'Pay',
    title: 'RosterPay',
    description: 'Учёт счетов и остатков в кабинете.',
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
export const ROSTER_MODULE_ORDER = ['duty', 'ca', 'pay', 'rx']
