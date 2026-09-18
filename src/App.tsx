import { useState } from 'react'
import './App.css'
import CalendarScreen from './screens/CalendarScreen'
import AgendaScreen from './screens/AgendaScreen'
import ClientsScreen from './screens/ClientsScreen'
import MealsScreen from './screens/MealsScreen'

function App() {
  const [activeTab, setActiveTab] = useState('Calendar')
  const [showAddMenu, setShowAddMenu] = useState(false)

  const changeTab = (tab: string) => {
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

    return (
      <section>
        <h2>{activeTab}</h2>
        <p>This is the {activeTab} screen.</p>
      </section>
    )
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Dog Sitting App</h1>

        {activeTab === 'Settings' ? (
          <button
            className="settings-button"
            onClick={() => changeTab('Calendar')}
          >
            Back
          </button>
        ) : (
          <button
            className="settings-button"
            onClick={() => changeTab('Settings')}
          >
            Settings
          </button>
        )}
      </header>

      <div className="app-content">
        {renderScreen()}
      </div>

      {activeTab !== 'Settings' && (
        <>
          <nav className="bottom-nav">
            <button
              className={activeTab === 'Calendar' ? 'active' : ''}
              onClick={() => changeTab('Calendar')}
            >
              Calendar
            </button>

            <button
              className={activeTab === 'Agenda' ? 'active' : ''}
              onClick={() => changeTab('Agenda')}
            >
              Agenda
            </button>

            <button
              className={activeTab === 'Clients' ? 'active' : ''}
              onClick={() => changeTab('Clients')}
            >
              Clients
            </button>

            <button
              className={activeTab === 'Meals' ? 'active' : ''}
              onClick={() => changeTab('Meals')}
            >
              Meals
            </button>
          </nav>

          {showAddMenu && (
            <div className="add-menu">
              <button>Add Booking</button>
              <button>Add Event</button>
              <button>Add Meal</button>
            </div>
          )}

          <button
            className="floating-add-button"
            aria-label="Add new item"
            onClick={() => setShowAddMenu((current) => !current)}
          >
            +
          </button>
        </>
      )}
    </main>
  )
}

export default App