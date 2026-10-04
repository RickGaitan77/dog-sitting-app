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
        viewBox="0 0 190 42"
        aria-hidden="true"
        focusable="false"
      >
        <g className="app-header-horseshoe">
          <path d="M7 7v9c0 10 6 17 15 17s15-7 15-17V7M13 9v7c0 6 3 10 9 10s9-4 9-10V9" />
          <circle cx="10" cy="11" r=".8" /><circle cx="34" cy="11" r=".8" />
          <circle cx="10" cy="19" r=".8" /><circle cx="34" cy="19" r=".8" />
        </g>
        <path className="app-header-vine app-header-vine-main" d="M34 25c15 7 26 4 36-5 9-8 16-13 27-8 9 4 12 14 22 16 12 3 22-2 31-10 8-7 15-8 24-4" />
        <path className="app-header-vine app-header-vine-echo" d="M39 29c13 1 23-4 31-12 8-7 17-10 25-5M118 29c10 3 20 0 29-8 8-7 17-10 26-6" />
        <g className="app-header-branches">
          <path d="M48 27c-2-7-7-12-13-14M58 24c-6-1-11-5-13-10M69 20c-2-6 0-11 5-15M78 14c-1-5 2-9 7-12M88 11c3-5 8-7 13-6M111 23c-1-7 2-13 7-17M125 29c4 5 9 7 15 7M139 24c5 1 11-1 15-5M151 17c3-6 8-9 14-10M164 13c1-4 5-7 9-7" />
          <path d="M42 29c-4 2-7 5-7 9M72 19c-5 2-8 6-8 11M132 27c-1 5 1 9 5 12M157 16c5 1 8 4 10 8" />
        </g>
        <path className="app-header-leaf" d="M45 23c-6 1-10-3-11-9 6-1 11 3 11 9ZM57 20c-6 0-10-4-11-9 7 0 11 4 11 9ZM68 16c-3-5 0-10 6-13 3 6 0 11-6 13ZM78 11c-1-5 3-9 8-11 1 6-2 10-8 11ZM90 9c3-5 8-7 14-5-3 6-8 8-14 5ZM110 19c-1-6 2-11 8-14 2 6-1 12-8 14ZM124 28c5-3 11-1 15 5-6 3-12 1-15-5ZM139 21c5-4 11-4 16 0-4 5-10 6-16 0ZM151 14c3-6 8-9 14-8-2 6-8 10-14 8ZM164 11c1-5 5-8 11-7-1 6-5 9-11 7ZM65 24c-5 1-8 5-8 10 6 0 9-4 8-10ZM133 31c4 0 8 3 9 8-5 1-9-2-9-8Z" />
        <g className="app-header-flower">
          <path d="M98 19c-4-1-6-4-5-7 4 0 6 2 5 7ZM99 19c1-4 4-6 7-5 0 4-3 6-7 5ZM99 20c4 0 6 3 5 6-4 0-6-2-5-6ZM97 20c0 4-3 6-6 5 0-4 2-6 6-5Z" />
          <circle className="app-header-flower-center" cx="98" cy="19.5" r="1.7" />
        </g>
        <g className="app-header-berries">
          <circle cx="76" cy="29" r="1.6" /><circle cx="80" cy="31" r="1.2" />
          <circle cx="145" cy="12" r="1.5" /><circle cx="149" cy="10" r="1.2" />
        </g>
        <g className="app-header-paw">
          <path className="app-header-paw-stem" d="M169 15c3 3 5 6 6 10" />
          <path d="M177 29c-4 0-7 3-7 6 0 3 2 4 5 2 2-1 4-1 6 0 3 2 5 1 5-2 0-3-4-6-9-6Z" />
          <circle cx="169" cy="28" r="2" /><circle cx="174" cy="24" r="2.1" />
          <circle cx="180" cy="24" r="2.1" /><circle cx="185" cy="28" r="2" />
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
