import type { AppScreen } from '../Types/AppScreen'

type BottomNavProps = {
  activeTab: AppScreen
  onChangeTab: (tab: AppScreen) => void
}

function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const items: ReadonlyArray<{
    label: Exclude<AppScreen, 'Settings'>
    icon: string
  }> = [
    { label: 'Calendar', icon: '▣' },
    { label: 'Agenda', icon: '▤' },
    { label: 'Clients', icon: '♟' },
    { label: 'Meals', icon: '♨' },
  ]

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map((item) => (
        <button
          className={activeTab === item.label ? 'active' : ''}
          onClick={() => onChangeTab(item.label)}
          aria-current={activeTab === item.label ? 'page' : undefined}
          key={item.label}
        >
          <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav
