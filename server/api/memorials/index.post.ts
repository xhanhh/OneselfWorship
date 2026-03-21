import { readBody } from 'h3'
import prisma from '~~/server/utils/prisma'
import type { CreateMemorialRequest } from '~~/app/types/Request'
import type { CreateMemorialResponseData } from '~~/app/types/Response'
import {
  optionalImageUrl,
  requireEmail,
  requireString,
  successResponse
} from '../../utils/api'
import { generateUniqueMemorialSlug, memorialSelect, toMemorialItem } from '../../utils/memorial'
import { assertTurnstileToken } from '../../utils/turnstile'

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<CreateMemorialRequest>>(event)
  const name = requireString(body?.name, 'name', { max: 80 })
  const description = requireString(body?.description, 'description', { max: 2000 })
  const contactEmail = requireEmail(body?.contactEmail)
  const imageUrl = optionalImageUrl(body?.imageUrl) ?? null

  await assertTurnstileToken(body?.turnstileToken)

  const slug = await generateUniqueMemorialSlug(name)
  const publishedAt = new Date()

  const memorial = await prisma.memorial.create({
    data: {
      slug,
      name,
      description,
      contactEmail,
      status: 'PUBLISHED',
      tributeCount: 0,
      is_del: false,
      imageUrl,
      publishedAt
    },
    select: memorialSelect
  })

  return successResponse<CreateMemorialResponseData>('Created successfully', {
    memorial: toMemorialItem(memorial)
  })
})