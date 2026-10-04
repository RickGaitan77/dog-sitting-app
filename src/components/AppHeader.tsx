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
        viewBox="0 0 150 30"
        aria-hidden="true"
        focusable="false"
      >
        <g className="app-header-horseshoe">
          <path d="M5 4v8c0 8 5 13 12 13s12-5 12-13V4M10 5v7c0 5 3 8 7 8s7-3 7-8V5" />
          <circle cx="7.5" cy="7" r=".8" /><circle cx="26.5" cy="7" r=".8" />
        </g>
        <path d="M28 18c20 2 30-11 48-9 17 2 25 12 43 8 6-1 10-4 14-7" />
        <path d="M48 16c-4-6-9-8-14-8M67 10c-1-5 1-8 5-10M91 13c2-5 6-8 11-9M111 18c3 4 7 6 12 6" />
        <path className="app-header-leaf" d="M43 13c-5 0-8-3-9-7 6 0 9 3 9 7ZM67 7c-2-4 1-7 5-9 2 5 0 8-5 9ZM94 9c1-5 5-7 10-7-1 5-5 8-10 7ZM115 20c4-2 8 0 10 4-5 2-9 0-10-4Z" />
        <g className="app-header-paw">
          <path d="M138 21c-4 0-7 3-7 6 0 2 2 3 4 2 2-1 4-1 6 0 2 1 4 0 4-2 0-3-3-6-7-6Z" />
          <circle cx="130" cy="20" r="2" /><circle cx="135" cy="16" r="2.1" /><circle cx="141" cy="16" r="2.1" /><circle cx="146" cy="20" r="2" />
        </g>
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
