import { useState } from 'react'
import './App.css'
import AppHeader from './components/AppHeader'
import BottomNav from './components/BottomNav'
import FloatingAddButton from './components/FloatingAddButton'
import { screenRegistry } from './config/screenRegistry'
import type { AppScreen } from './Types/AppScreen'

function App() {
  const [activeTab, setActiveTab] = useState<AppScreen>('Calendar')
  const [showAddMenu, setShowAddMenu] = useState(false)

  const changeTab = (tab: AppScreen) => {
    setActiveTab(tab)
    setShowAddMenu(false)
  }

  return (
    <main className="app-shell">
      <AppHeader
        isSettingsOpen={activeTab === 'Settings'}
        onOpenSettings={() => changeTab('Settings')}
        onBack={() => changeTab('Calendar')}
      />

      <div className="app-content">
        {screenRegistry[activeTab]}
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