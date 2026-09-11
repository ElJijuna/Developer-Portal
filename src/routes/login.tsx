import { createFileRoute, redirect } from '@tanstack/react-router';
import { auth } from '@/auth/proxy/firebase';
import { GITHUB_TOKEN_KEY } from '@/auth/constants';
import { Login } from '@/auth/components/Login';

export const Route = createFileRoute('/login')({
  async beforeLoad() {
    if (auth) await auth.authStateReady()
    // Firebase's session lives in IndexedDB while the GitHub token lives in
    // localStorage, so the two can go out of sync (e.g. a manual
    // localStorage.clear()). Require both here, matching `_authenticated`'s
    // check, so this route and `_authenticated` never redirect to each other
    // in a loop.
    const token = localStorage.getItem(GITHUB_TOKEN_KEY) ?? ''
    if (auth?.currentUser && token) throw redirect({ to: '/' })
  },
  component: Login,
})
