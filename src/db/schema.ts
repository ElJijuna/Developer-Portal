export type NotificationRecord = {
  id: string
  unread: boolean
  reason: string
  subject_title: string
  subject_type: string
  subject_url: string | null
  repo_name: string
  repo_full_name: string
  updated_at: string
}

export type UserRecord = {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  public_gists: number
}

export type RepoRecord = {
  id: number
  name: string
  full_name: string
  owner_login: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  private: boolean
  pushed_at: string
  updated_at: string
}
