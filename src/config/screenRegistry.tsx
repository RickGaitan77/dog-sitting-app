import type { ReactNode } from 'react'
import type { AppScreen } from '../Types/AppScreen'
import CalendarScreen from '../screens/CalendarScreen'
import AgendaScreen from '../screens/AgendaScreen'
import ClientsScreen from '../screens/ClientsScreen'
import MealsScreen from '../screens/MealsScreen'
import SettingsScreen from '../screens/SettingsScreen'

export type ScreenContext = {
  bookingCreationRequested: boolean
  eventCreationRequested: boolean
  mealCreationRequested: boolean
  onBookingCreationHandled: () => void
  onEventCreationHandled: () => void
  onMealCreationHandled: () => void
}

type ScreenRenderer = (context: ScreenContext) => ReactNode

export const screenRegistry: Record<AppScreen, ScreenRenderer> = {
  Calendar: (context) => <CalendarScreen {...context} />,
  Agenda: () => <AgendaScreen />,
  Clients: () => <ClientsScreen />,
  Meals: (context) => (
    <MealsScreen
      mealCreationRequested={context.mealCreationRequested}
      onMealCreationHandled={context.onMealCreationHandled}
    />
  ),
  Settings: () => <SettingsScreen />,
}
