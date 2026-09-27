import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { APP_DISPLAY_NAME } from './config/appMetadata'
import { initializeDatabase } from './db'

document.title = APP_DISPLAY_NAME

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Root element was not found')
}

const root = createRoot(rootElement)

function renderApp() {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void initializeDatabase()
  .then(renderApp)
  .catch((error: unknown) => {
    console.error('Failed to initialize the local database', error)
    renderApp()
  })
