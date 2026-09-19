import { useState } from 'react'
import './App.css'
import AppHeader from './components/AppHeader'
import BottomNav from './components/BottomNav'
import FloatingAddButton from './components/FloatingAddButton'
import CalendarScreen from './screens/CalendarScreen'
import AgendaScreen from './screens/AgendaScreen'
import ClientsScreen from './screens/ClientsScreen'
import MealsScreen from './screens/MealsScreen'
import SettingsScreen from './screens/SettingsScreen'
import type { AppScreen } from './Types/AppScreen'

function App() {
  const [activeTab, setActiveTab] = useState<AppScreen>('Calendar')
  const [showAddMenu, setShowAddMenu] = useState(false)

  const changeTab = (tab: AppScreen) => {
    setActiveTab(tab)
    setShowAddMenu(false)
  }

  const renderScreen = () => {
    if (activeTab === 'Calendar') {
      return <CalendarScreen />
    }

    if (activeTab === 'Agenda') {
      return <AgendaScreen />
    }

    if (activeTab === 'Clients') {
      return <ClientsScreen />
    }

    if (activeTab === 'Meals') {
      return <MealsScreen />
    }

    if (activeTab === 'Settings') {
      return <SettingsScreen />
    }

    return null
  }

  return (
    <main className="app-shell">
      <AppHeader
        isSettingsOpen={activeTab === 'Settings'}
        onOpenSettings={() => changeTab('Settings')}
        onBack={() => changeTab('Calendar')}
      />

      <div className="app-content">
        {renderScreen()}
      </div>

      {activeTab !== 'Settings' && (
        <>
          <BottomNav
            activeTab={activeTab}
            onChangeTab={changeTab}
          />

          <FloatingAddButton
            isOpen={showAddMenu}
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