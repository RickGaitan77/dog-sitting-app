import type { AppSettings } from './Settings'
import type { Area } from './Area'
import type { Booking } from './Booking'
import type { Client } from './Client'
import type { GeneralEvent } from './GeneralEvent'
import type { Meal } from './Meal'
import type { Pet } from './Pet'
import type { Service } from './Service'

export type ReminderType =
  | 'booking-start'
  | 'booking-end'
  | 'medication'
  | 'meal-planning'

export type Reminder = {
  id: string
  type: ReminderType
  entityId: string
  title: string
  message: string
  relevantDate: string
  isDue: boolean
}

export type WeeklyOverviewItem = {
  id: string
  kind: 'booking' | 'event' | 'meal'
  title: string
  dateLabel: string
  summary?: string
  areaName?: string
  areaColor?: string
}

export type WeeklyOverview = {
  startDate: string
  endDate: string
  items: WeeklyOverviewItem[]
}

export type ReminderSourceData = {
  settings: AppSettings
  bookings: Booking[]
  clients: Client[]
  pets: Pet[]
  areas: Area[]
  services: Service[]
  events: GeneralEvent[]
  meals: Meal[]
}

export type ReminderSnapshot = {
  date: string
  settings: AppSettings
  reminders: Reminder[]
  weeklyOverview?: WeeklyOverview
}
