import type { WorkflowRunConclusion } from 'gh-api-client'

export const SEVERITY_COLOR: Record<string, string> = {
  critical: '#e01b24',
  high: '#e66100',
  medium: '#e5a50a',
  low: '#3584e4',
  unknown: '#77767b',
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function conclusionColor(conclusion: WorkflowRunConclusion): string {
  switch (conclusion) {
    case 'success': return '#26a269'
    case 'failure': return '#e01b24'
    case 'cancelled': return '#77767b'
    case 'timed_out': return '#e66100'
    case 'action_required': return '#e5a50a'
    default: return '#77767b'
  }
}
