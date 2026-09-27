import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(
  await readFile(new URL('public/manifest.webmanifest', root), 'utf8'),
)
const html = await readFile(new URL('index.html', root), 'utf8')
const main = await readFile(new URL('src/main.tsx', root), 'utf8')
const registration = await readFile(
  new URL('src/pwa/registerServiceWorker.ts', root),
  'utf8',
)
const serviceWorker = await readFile(new URL('public/sw.js', root), 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function readPngSize(buffer) {
  const pngSignature = '89504e470d0a1a0a'
  assert(
    buffer.subarray(0, 8).toString('hex') === pngSignature,
    'PWA icon is not a valid PNG file.',
  )
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

assert(manifest.name === 'Dog Sitting App', 'Manifest name is invalid.')
assert(manifest.short_name === 'Dog Sitting', 'Manifest short_name is invalid.')
assert(manifest.start_url === '/', 'Manifest start_url is invalid.')
assert(manifest.scope === '/', 'Manifest scope is invalid.')
assert(manifest.display === 'standalone', 'Manifest display must be standalone.')
assert(Array.isArray(manifest.icons), 'Manifest icons are missing.')

for (const icon of manifest.icons) {
  const iconPath = icon.src.replace(/^\//, '')
  const iconBuffer = await readFile(new URL(`public/${iconPath}`, root))
  const size = readPngSize(iconBuffer)
  const expected = Number(icon.sizes.split('x')[0])
  assert(
    size.width === expected && size.height === expected,
    `${icon.src} does not match its declared size.`,
  )
}

assert(
  manifest.icons.some((icon) => icon.sizes === '192x192' && icon.purpose === 'any'),
  'A 192x192 standard icon is required.',
)
assert(
  manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'any'),
  'A 512x512 standard icon is required.',
)
assert(
  manifest.icons.some((icon) => icon.purpose === 'maskable'),
  'A maskable icon is required.',
)
assert(html.includes('rel="manifest" href="/manifest.webmanifest"'), 'Manifest link is missing.')
assert(html.includes('name="theme-color"'), 'Theme color metadata is missing.')
assert(main.includes('registerServiceWorker()'), 'Service worker registration is not called.')
assert(registration.includes('import.meta.env.PROD'), 'Service worker must be production-only.')
assert(registration.includes("register('/sw.js')"), 'Service worker path is invalid.')
assert(serviceWorker.includes("caches.match('/index.html')"), 'Offline shell fallback is missing.')
assert(!serviceWorker.includes('skipWaiting'), 'Service worker must not force an active-session update.')

console.log('PWA manifest, icons, metadata, registration, and offline shell checks passed.')
