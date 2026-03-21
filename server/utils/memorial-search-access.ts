import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { forbidden } from './api'

const ACCESS_TOKEN_TTL_MS = 10 * 60 * 1000

export function createMemorialSearchAccessToken(event: H3Event, contactEmail: string) {
  const expiresAt = Date.now() + ACCESS_TOKEN_TTL_MS
  const payload = `${contactEmail.toLowerCase()}|${expiresAt}`
  const signature = signValue(event, payload)

  return Buffer.from(`${payload}|${signature}`, 'utf8').toString('base64url')
}

export function assertMemorialSearchAccessToken(event: H3Event, accessToken: string, contactEmail: string) {
  const decodedToken = decodeAccessToken(accessToken)
  const [tokenEmail, expiresAtValue, signature] = decodedToken.split('|')

  if (!tokenEmail || !expiresAtValue || !signature) {
    forbidden('Search access token is invalid')
  }

  const payload = `${tokenEmail}|${expiresAtValue}`
  const expectedSignature = signValue(event, payload)
  const expectedBuffer = Buffer.from(expectedSignature)
  const actualBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    forbidden('Search access token is invalid')
  }

  if (tokenEmail !== contactEmail.toLowerCase()) {
    forbidden('Search access token does not match email')
  }

  const expiresAt = Number.parseInt(expiresAtValue, 10)

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    forbidden('Search access token has expired')
  }
}

function decodeAccessToken(accessToken: string) {
  try {
    return Buffer.from(accessToken, 'base64url').toString('utf8')
  } catch {
    forbidden('Search access token is invalid')
  }
}

function signValue(event: H3Event, value: string) {
  return createHmac('sha256', getSigningSecret(event))
    .update(value)
    .digest('hex')
}

function getSigningSecret(event: H3Event) {
  const runtimeConfig = useRuntimeConfig(event)
  const turnstileSecret = String(runtimeConfig.turnstile?.secretKey || '').trim()
  const adminEmail = String(runtimeConfig.adminEmail || '').trim()

  return turnstileSecret || adminEmail || 'qingming-search-access'
}