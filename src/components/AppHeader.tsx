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
