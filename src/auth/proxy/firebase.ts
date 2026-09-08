import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const isConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
)

export let app: FirebaseApp | null = null
export let auth: Auth | null = null

if (isConfigured) {
  app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  })
  auth = getAuth(app)
}

// TanStack Router awaits `beforeLoad` on every navigation. Firebase's
// `authStateReady()` resolves asynchronously even when the state is already
// known, which is enough of a gap for the router to suspend and briefly hide
// the whole app shell. Await it only once, on the initial load.
let authReadyResolved = false
export const authReady: Promise<void> = auth ? auth.authStateReady() : Promise.resolve()
authReady.then(() => {
  authReadyResolved = true
})

export function isAuthReady(): boolean {
  return authReadyResolved
}
