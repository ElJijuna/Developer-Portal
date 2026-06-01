import { useMutation } from '@tanstack/react-query'
import { signOut } from '@/auth/proxy'

export function useSignOut() {
  return useMutation({ mutationFn: signOut })
}
