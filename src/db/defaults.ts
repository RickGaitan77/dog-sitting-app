import type { AppSettings, Area, Service } from '../Types'

export const SETTINGS_PRIMARY_KEY = 'app-settings'

export const DEFAULT_SETTINGS: Readonly<AppSettings> = {
  showMealOverlay: true,
  reduceMotion: false,
  weeklyOverviewEnabled: false,
  bookingStartReminderEnabled: false,
  bookingEndReminderEnabled: false,
  medicationReminderEnabled: false,
  mealPlanningReminderEnabled: false,
}

export const DEFAULT_AREAS: readonly Area[] = [
  {
    id: 'area-west-columbia',
    name: 'West Columbia',
    color: 'orange',
    sortOrder: 0,
    archived: false,
  },
  {
    id: 'area-freeport',
    name: 'Freeport',
    color: 'blue',
    sortOrder: 1,
    archived: false,
  },
  {
    id: 'area-lake-jackson',
    name: 'Lake Jackson',
    color: 'green',
    sortOrder: 2,
    archived: false,
  },
]

export const DEFAULT_SERVICES: readonly Service[] = [
  {
    id: 'service-morning-visit',
    name: 'Morning visit',
    sortOrder: 0,
    archived: false,
  },
  {
    id: 'service-evening-visit',
    name: 'Evening visit',
    sortOrder: 1,
    archived: false,
  },
  {
    id: 'service-night-visit',
    name: 'Night visit',
    sortOrder: 2,
    archived: false,
  },
  {
    id: 'service-overnight',
    name: 'Overnight',
    sortOrder: 3,
    archived: false,
  },
  {
    id: 'service-medication',
    name: 'Medication',
    sortOrder: 4,
    archived: false,
  },
  {
    id: 'service-nail-trim',
    name: 'Nail trim',
    sortOrder: 5,
    archived: false,
  },
  {
    id: 'service-dog-walking',
    name: 'Dog walking',
    sortOrder: 6,
    archived: false,
  },
  {
    id: 'service-horse-riding-training',
    name: 'Horse riding/training',
    sortOrder: 7,
    archived: false,
  },
]

export function createDefaultSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS }
}
