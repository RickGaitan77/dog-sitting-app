type BottomNavProps = {
  activeTab: string
  onChangeTab: (tab: string) => void
}

function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button
        className={activeTab === 'Calendar' ? 'active' : ''}
        onClick={() => onChangeTab('Calendar')}
      >
        Calendar
      </button>

      <button
        className={activeTab === 'Agenda' ? 'active' : ''}
        onClick={() => onChangeTab('Agenda')}
      >
        Agenda
      </button>

      <button
        className={activeTab === 'Clients' ? 'active' : ''}
        onClick={() => onChangeTab('Clients')}
      >
        Clients
      </button>

      <button
        className={activeTab === 'Meals' ? 'active' : ''}
        onClick={() => onChangeTab('Meals')}
      >
        Meals
      </button>
    </nav>
  )
}

export default BottomNav