import { useMutation } from '@tanstack/react-query'
import { signInWithGitHub } from '../proxy'
import { useAuth } from '../AuthProvider'

export function useSignIn() {
  const { setGithubToken } = useAuth()
  return useMutation({
    mutationFn: signInWithGitHub,
    onSuccess: (authUser) => setGithubToken(authUser.githubToken),
  })
}
