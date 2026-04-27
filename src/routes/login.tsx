import { createFileRoute, redirect } from '@tanstack/react-router';
import { auth } from '../auth/proxy/firebase';
import { Login } from '../auth/components/Login';

export const Route = createFileRoute('/login')({
  async beforeLoad() {
    if (auth) await auth.authStateReady()
    if (auth?.currentUser) throw redirect({ to: '/' })
  },
  component: Login,
})
