import type { AppScreen } from '../Types/AppScreen'

type BottomNavProps = {
  activeTab: AppScreen
  onChangeTab: (tab: AppScreen) => void
}

function BottomNavIcon({ label }: { label: Exclude<AppScreen, 'Settings'> }) {
  if (label === 'Calendar') {
    return <svg className="bottom-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14a2 2 0 0 1 2 2V20H3V6.5a2 2 0 0 1 2-2ZM3 9h18M8 2.5v4M16 2.5v4" /><path d="M7.5 12.5h2M11 12.5h2M14.5 12.5h2M7.5 16h2M11 16h2M14.5 16h2" /></svg>
  }
  if (label === 'Agenda') {
    return <svg className="bottom-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h13a2 2 0 0 1 2 2V20H6a3 3 0 0 1-3-3V6.5a3 3 0 0 1 3-3Z" /><path d="M7.5 8h9M7.5 12h9M7.5 16h6M3 6.5h3M3 17h3" /></svg>
  }
  if (label === 'Clients') {
    return <svg className="bottom-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 20c.4-4.4 2.4-6.5 5.5-6.5s5.1 2.1 5.5 6.5M14 14.5c.8-.7 1.8-1 3-1 2.4 0 3.8 1.8 4 5.5" /></svg>
  }
  return <svg className="bottom-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v7M4 3v5a3 3 0 0 0 6 0V3M7 10v11M16 3c3 2 4 5 4 8 0 2-1 4-3 5v5M16 3v13" /></svg>
}

function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const items: ReadonlyArray<Exclude<AppScreen, 'Settings'>> = [
    'Calendar',
    'Agenda',
    'Clients',
    'Meals',
  ]

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map((item) => (
        <button
          className={activeTab === item ? 'active' : ''}
          onClick={() => onChangeTab(item)}
          aria-current={activeTab === item ? 'page' : undefined}
          key={item}
        >
          <BottomNavIcon label={item} />
          <span>{item}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav
