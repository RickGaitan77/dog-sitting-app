import { useState } from 'react'
import './App.css'
import AppHeader from './components/AppHeader'
import BottomNav from './components/BottomNav'
import FloatingAddButton from './components/FloatingAddButton'
import ReminderCenter from './components/reminders/ReminderCenter'
import { screenRegistry } from './config/screenRegistry'
import type { AppScreen } from './Types/AppScreen'
import type { ScheduleFilters } from './Types/ScheduleFilters'

function App() {
  const [activeTab, setActiveTab] = useState<AppScreen>('Calendar')
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [bookingCreationRequested, setBookingCreationRequested] =
    useState(false)
  const [eventCreationRequested, setEventCreationRequested] =
    useState(false)
  const [mealCreationRequested, setMealCreationRequested] =
    useState(false)
  const [mealOpenRequested, setMealOpenRequested] = useState<string | null>(null)
  const [scheduleFilters, setScheduleFilters] = useState<ScheduleFilters>({
    bookings: true,
    events: true,
    meals: true,
  })

  const changeTab = (tab: AppScreen) => {
    setActiveTab(tab)
    setShowAddMenu(false)
    setMealOpenRequested(null)
  }

  return (
    <main className="app-shell">
      <AppHeader
        isSettingsOpen={activeTab === 'Settings'}
        onOpenSettings={() => changeTab('Settings')}
        onBack={() => changeTab('Calendar')}
      />

      <div className="app-content">
        {activeTab !== 'Settings' && <ReminderCenter />}
        {screenRegistry[activeTab]({
          bookingCreationRequested,
          eventCreationRequested,
          mealCreationRequested,
          mealOpenRequested,
          scheduleFilters,
          onScheduleFiltersChange: setScheduleFilters,
          onBookingCreationHandled: () =>
            setBookingCreationRequested(false),
          onEventCreationHandled: () =>
            setEventCreationRequested(false),
          onMealCreationHandled: () =>
            setMealCreationRequested(false),
          onOpenSettings: () => changeTab('Settings'),
          onOpenMeal: (mealId) => {
            setActiveTab('Meals')
            setShowAddMenu(false)
            setBookingCreationRequested(false)
            setEventCreationRequested(false)
            setMealCreationRequested(false)
            setMealOpenRequested(mealId)
          },
        })}
      </div>

      {activeTab !== 'Settings' && (
        <>
          <BottomNav
            activeTab={activeTab}
            onChangeTab={changeTab}
          />

          <FloatingAddButton
            isOpen={showAddMenu}
            onAddBooking={() => {
              setActiveTab('Calendar')
              setShowAddMenu(false)
              setEventCreationRequested(false)
              setMealCreationRequested(false)
              setMealOpenRequested(null)
              setBookingCreationRequested(true)
            }}
            onAddEvent={() => {
              setActiveTab('Calendar')
              setShowAddMenu(false)
              setBookingCreationRequested(false)
              setMealCreationRequested(false)
              setMealOpenRequested(null)
              setEventCreationRequested(true)
            }}
            onAddMeal={() => {
              setActiveTab('Meals')
              setShowAddMenu(false)
              setBookingCreationRequested(false)
              setEventCreationRequested(false)
              setMealOpenRequested(null)
              setMealCreationRequested(true)
            }}
            onToggle={() =>
              setShowAddMenu((current) => !current)
            }
          />
        </>
      )}
    </main>
  )
}

export default App
