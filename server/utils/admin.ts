import type { H3Event } from 'h3'

export function getAdminEmail(event: H3Event) {
  return String(useRuntimeConfig(event).adminEmail || '').trim().toLowerCase()
}

export function isAdminEmail(event: H3Event, email: string) {
  const adminEmail = getAdminEmail(event)

  return !!adminEmail && email.trim().toLowerCase() === adminEmail
}