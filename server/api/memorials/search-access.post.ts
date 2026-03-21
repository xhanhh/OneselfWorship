import { readBody } from 'h3'
import type { SearchMemorialAccessRequest } from '~~/app/types/Request'
import { requireEmail, successResponse } from '../../utils/api'
import { createMemorialSearchAccessToken } from '../../utils/memorial-search-access'
import { assertTurnstileToken } from '../../utils/turnstile'

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<SearchMemorialAccessRequest>>(event)
  const contactEmail = requireEmail(body?.contactEmail)

  await assertTurnstileToken(body?.turnstileToken)

  return successResponse('Search access granted', {
    contactEmail,
    accessToken: createMemorialSearchAccessToken(event, contactEmail)
  })
})