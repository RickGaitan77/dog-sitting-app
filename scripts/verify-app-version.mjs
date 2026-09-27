import { readFile } from 'node:fs/promises'

const metadataPath = new URL('../src/config/appMetadata.ts', import.meta.url)
const headerPath = new URL('../src/components/AppHeader.tsx', import.meta.url)
const mainPath = new URL('../src/main.tsx', import.meta.url)

const [metadata, header, main] = await Promise.all([
  readFile(metadataPath, 'utf8'),
  readFile(headerPath, 'utf8'),
  readFile(mainPath, 'utf8'),
])

const checks = [
  {
    passed: /export const APP_VERSION = ['"][^'"]+['"]/.test(metadata),
    message: 'The centralized APP_VERSION constant is missing.',
  },
  {
    passed:
      header.includes("import { APP_DISPLAY_NAME } from '../config/appMetadata'") &&
      header.includes('<h1>{APP_DISPLAY_NAME}</h1>'),
    message: 'The app header is not using the centralized display name.',
  },
  {
    passed:
      main.includes("import { APP_DISPLAY_NAME } from './config/appMetadata'") &&
      main.includes('document.title = APP_DISPLAY_NAME'),
    message: 'The document title is not using the centralized display name.',
  },
]

const failedCheck = checks.find((check) => !check.passed)

if (failedCheck !== undefined) {
  throw new Error(failedCheck.message)
}

console.log('Application version is centralized and used by the header and document title.')
