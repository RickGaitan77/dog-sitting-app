import type { ReactNode } from 'react'
import type { AppScreen } from '../Types/AppScreen'
import CalendarScreen from '../screens/CalendarScreen'
import AgendaScreen from '../screens/AgendaScreen'
import ClientsScreen from '../screens/ClientsScreen'
import MealsScreen from '../screens/MealsScreen'
import SettingsScreen from '../screens/SettingsScreen'

export const screenRegistry: Record<AppScreen, ReactNode> = {
  Calendar: <CalendarScreen />,
  Agenda: <AgendaScreen />,
  Clients: <ClientsScreen />,
  Meals: <MealsScreen />,
  Settings: <SettingsScreen />,
}