import { forbidden, requireString } from './api'

export async function assertTurnstileToken(token: unknown) {
  const verifiedToken = requireString(token, 'turnstileToken', { max: 4096 })
  const verificationResult = await verifyTurnstileToken(verifiedToken)

  if (!verificationResult?.success) {
    forbidden('Cloudflare Turnstile verification failed')
  }

  return verificationResult
}