export const STORAGE_KEYS = {
  STATUS_DATA: 'statusData'
} as const;

export const ALTITUDE_COLORS = {
  EXCELLENT: 'text-green-600 dark:text-green-400',
  GOOD: 'text-yellow-600 dark:text-yellow-400',
  FAIR: 'text-orange-600 dark:text-orange-400',
  LOW: 'text-red-600 dark:text-red-400'
} as const;

export const TIME_UNITS = {
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000
} as const;