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
        viewBox="0 0 170 34"
        aria-hidden="true"
        focusable="false"
      >
        <g className="app-header-horseshoe">
          <path d="M4 4v9c0 9 6 15 14 15s14-6 14-15V4M10 6v7c0 5 3 9 8 9s8-4 8-9V6" />
          <circle cx="7" cy="8" r=".8" /><circle cx="29" cy="8" r=".8" /><circle cx="7" cy="15" r=".8" /><circle cx="29" cy="15" r=".8" />
        </g>
        <path className="app-header-vine" d="M29 20c13 5 23 1 31-7 8-7 18-9 27-3 10 7 18 14 31 10 10-3 14-11 24-12 5 0 9 1 13 4" />
        <path d="M43 21c-2-7-7-11-13-13M55 16c-6 0-11-3-14-8M68 8c-1-5 2-8 6-10M82 8c3-5 8-7 13-6M96 15c0-6 3-10 8-13M111 21c4 4 9 6 14 5M125 17c5 1 10-1 14-5M142 8c0-4 3-7 7-8" />
        <path className="app-header-leaf" d="M39 17c-5 1-9-2-10-7 6-1 10 2 10 7ZM51 13c-5 0-8-3-9-7 6 0 9 3 9 7ZM68 6c-2-4 1-8 6-10 2 5 0 9-6 10ZM83 7c2-5 7-7 12-6-2 5-6 8-12 6ZM97 12c0-5 3-9 8-11 2 5-1 10-8 11ZM115 22c4-3 9-1 12 4-5 3-10 1-12-4ZM128 15c4-4 9-4 13-1-3 5-8 6-13 1ZM143 6c1-5 5-7 10-7-1 5-5 8-10 7Z" />
        <g className="app-header-berries">
          <circle cx="58" cy="10" r="1.5" /><circle cx="61" cy="7" r="1.2" /><circle cx="107" cy="18" r="1.4" /><circle cx="111" cy="17" r="1.1" />
        </g>
        <g className="app-header-paw">
          <path d="M158 24c-4 0-7 3-7 6 0 3 2 4 5 2 2-1 4-1 6 0 3 2 5 1 5-2 0-3-4-6-9-6Z" />
          <circle cx="150" cy="23" r="2" /><circle cx="155" cy="19" r="2.1" /><circle cx="161" cy="19" r="2.1" /><circle cx="166" cy="23" r="2" />
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
