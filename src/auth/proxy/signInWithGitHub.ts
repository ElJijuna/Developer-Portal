import { GithubAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/auth/proxy/firebase'
import { persistGithubToken } from '@/auth/AuthProvider'
import type { AuthUser } from '@/auth/domain'

const provider = new GithubAuthProvider()
provider.addScope('gist')
provider.addScope('read:user')
provider.addScope('notifications')
provider.addScope('repo')

export async function signInWithGitHub(): Promise<AuthUser> {
  if (!auth) throw new Error('Firebase is not configured')

  const result = await signInWithPopup(auth, provider)
  const credential = GithubAuthProvider.credentialFromResult(result)

  if (!credential?.accessToken) {
    throw new Error('GitHub access token not returned by Firebase')
  }

  persistGithubToken(credential.accessToken)

  return {
    uid: result.user.uid,
    displayName: result.user.displayName,
    email: result.user.email,
    photoURL: result.user.photoURL,
    githubToken: credential.accessToken,
  }
}
