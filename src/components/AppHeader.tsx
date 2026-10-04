import { APP_DISPLAY_NAME } from '../config/appMetadata'

type AppHeaderProps = {
  isSettingsOpen: boolean
  onOpenSettings: () => void
  onBack: () => void
}

function AppHeader({
  isSettingsOpen,
  onOpenSettings,
  onBack,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <h1>{APP_DISPLAY_NAME}</h1>
      <svg
        className="app-header-flourish"
        viewBox="0 0 64 28"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M5 23c13-1 24-7 35-14 6-4 11-5 18-4" />
        <path d="M21 19c-4-5-8-8-13-8M31 15c-2-5-1-9 3-12M42 8c1 5 5 8 10 9" />
        <path className="app-header-leaf" d="M14 15c-4 0-7-3-7-7 5 0 8 3 7 7ZM30 10c-3-3-1-7 3-9 3 4 2 8-3 9ZM46 12c3-3 7-2 10 2-4 3-8 2-10-2Z" />
        <ellipse cx="54" cy="4" rx="1.6" ry="3" />
        <ellipse cx="54" cy="4" rx="1.6" ry="3" transform="rotate(72 54 4)" />
        <ellipse cx="54" cy="4" rx="1.6" ry="3" transform="rotate(144 54 4)" />
        <circle className="app-header-flower-center" cx="54" cy="4" r="1.2" />
      </svg>

      {isSettingsOpen ? (
        <button className="settings-button" onClick={onBack}>
          Back
        </button>
      ) : (
        <button className="settings-button" onClick={onOpenSettings}>
          Settings
        </button>
      )}
    </header>
  )
}

export default AppHeader
