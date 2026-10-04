import type { ReactNode } from 'react'
import type { AppScreen } from '../Types/AppScreen'
import type { ScheduleFilters } from '../Types/ScheduleFilters'
import CalendarScreen from '../screens/CalendarScreen'
import AgendaScreen from '../screens/AgendaScreen'
import ClientsScreen from '../screens/ClientsScreen'
import MealsScreen from '../screens/MealsScreen'
import SettingsScreen from '../screens/SettingsScreen'

export type ScreenContext = {
  bookingCreationRequested: boolean
  eventCreationRequested: boolean
  mealCreationRequested: boolean
  mealOpenRequested: string | null
  scheduleFilters: ScheduleFilters
  onBookingCreationHandled: () => void
  onEventCreationHandled: () => void
  onMealCreationHandled: () => void
  onOpenMeal: (mealId: string) => void
  onScheduleFiltersChange: (filters: ScheduleFilters) => void
}

type ScreenRenderer = (context: ScreenContext) => ReactNode

export const screenRegistry: Record<AppScreen, ScreenRenderer> = {
  Calendar: (context) => (
    <CalendarScreen
      {...context}
      filters={context.scheduleFilters}
      onFiltersChange={context.onScheduleFiltersChange}
    />
  ),
  Agenda: (context) => (
    <AgendaScreen
      filters={context.scheduleFilters}
      onFiltersChange={context.onScheduleFiltersChange}
    />
  ),
  Clients: () => <ClientsScreen />,
  Meals: (context) => (
    <MealsScreen
      mealCreationRequested={context.mealCreationRequested}
      mealOpenRequested={context.mealOpenRequested}
      onMealCreationHandled={context.onMealCreationHandled}
    />
  ),
  Settings: () => <SettingsScreen />,
}
