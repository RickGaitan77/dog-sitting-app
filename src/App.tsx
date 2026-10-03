import { useEffect, useState } from 'react'
import './App.css'
import AppHeader from './components/AppHeader'
import BottomNav from './components/BottomNav'
import FloatingAddButton from './components/FloatingAddButton'
import ReminderCenter from './components/reminders/ReminderCenter'
import { screenRegistry } from './config/screenRegistry'
import type { AppScreen } from './Types/AppScreen'
import type { ScheduleFilters } from './Types/ScheduleFilters'
import { appServices } from './services'
import { REDUCE_MOTION_CHANGE_EVENT } from './utils/motionPreference'

function App() {
  const [reduceMotion, setReduceMotion] = useState(false)
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

  useEffect(() => {
    let isCurrent = true
    void appServices.settings
      .get()
      .then((settings) => {
        if (isCurrent) setReduceMotion(settings.reduceMotion)
      })
      .catch((settingsError: unknown) => {
        console.error('Failed to load motion preference', settingsError)
      })

    const handleReduceMotionChange = (event: Event) => {
      setReduceMotion((event as CustomEvent<boolean>).detail)
    }
    window.addEventListener(REDUCE_MOTION_CHANGE_EVENT, handleReduceMotionChange)

    return () => {
      isCurrent = false
      window.removeEventListener(REDUCE_MOTION_CHANGE_EVENT, handleReduceMotionChange)
    }
  }, [])

  const changeTab = (tab: AppScreen) => {
    setActiveTab(tab)
    setShowAddMenu(false)
    setMealOpenRequested(null)
  }

  return (
    <main className={`app-shell${reduceMotion ? ' reduce-motion' : ''}`}>
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
