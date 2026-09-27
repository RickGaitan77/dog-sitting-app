let registrationPromise: Promise<ServiceWorkerRegistration | undefined> | undefined

function waitForInstallation(worker: ServiceWorker): Promise<void> {
  if (worker.state !== 'installing') return Promise.resolve()

  return new Promise((resolve) => {
    const handleStateChange = () => {
      if (worker.state === 'installing') return
      worker.removeEventListener('statechange', handleStateChange)
      resolve()
    }
    worker.addEventListener('statechange', handleStateChange)
  })
}

function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return Promise.resolve(undefined)
  }

  registrationPromise ??= navigator.serviceWorker
    .register('/sw.js')
    .then(async (registration) => {
      if (registration.installing !== null) {
        await waitForInstallation(registration.installing)
      }
      if (registration.waiting !== null || registration.active !== null) {
        return registration
      }
      throw new Error('The service worker did not finish installing.')
    })
    .catch((error: unknown) => {
      console.error('Service worker registration failed', error)
      return undefined
    })

  return registrationPromise
}

export function registerServiceWorker(): void {
  void ensureServiceWorkerRegistration()
}

export function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  return ensureServiceWorkerRegistration()
}
