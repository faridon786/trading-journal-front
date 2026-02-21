import type { User } from '@/types/api'

/**
 * Prefer first name, then "First Last", then username.
 */
export function getDisplayName(user: User | null | undefined): string {
  if (!user) return ''
  const first = (user.first_name ?? '').trim()
  const last = (user.last_name ?? '').trim()
  if (first && last) return `${first} ${last}`
  if (first) return first
  return user.username
}

/**
 * Short form for headers: first name only, or username.
 */
export function getShortDisplayName(user: User | null | undefined): string {
  if (!user) return ''
  const first = (user.first_name ?? '').trim()
  if (first) return first
  return user.username
}
