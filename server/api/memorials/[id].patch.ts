import { getRouterParam, readBody } from 'h3'
import prisma from '~~/server/utils/prisma'
import type { UpdateMemorialRequest } from '~~/app/types/Request'
import type { UpdateMemorialResponseData } from '~~/app/types/Response'
import {
  badRequest,
  notFound,
  optionalImageUrl,
  optionalMemorialStatus,
  optionalString,
  requireEmail,
  requireIntegerRouteParam,
  successResponse
} from '../../utils/api'
import { isAdminEmail } from '../../utils/admin'
import { memorialSelect, toMemorialItem } from '../../utils/memorial'
import { assertTurnstileToken } from '../../utils/turnstile'

export default defineEventHandler(async (event) => {
  const memorialId = requireIntegerRouteParam(getRouterParam(event, 'id'), 'id')
  const body = await readBody<Partial<UpdateMemorialRequest>>(event)
  const contactEmail = requireEmail(body?.contactEmail)
  const useAdminAccess = isAdminEmail(event, contactEmail)

  await assertTurnstileToken(body?.turnstileToken)

  const updateData: {
    name?: string
    description?: string
    imageUrl?: string | null
    status?: 'PENDING' | 'PUBLISHED' | 'HIDDEN'
    publishedAt?: Date
  } = {}

  if (body?.name !== undefined) {
    updateData.name = optionalString(body.name, 'name', { max: 80 }) ?? undefined
  }

  if (body?.description !== undefined) {
    updateData.description = optionalString(body.description, 'description', { max: 2000 }) ?? undefined
  }

  if (body?.imageUrl !== undefined) {
    updateData.imageUrl = optionalImageUrl(body.imageUrl) ?? null
  }

  const status = optionalMemorialStatus(body?.status)

  if (status !== undefined) {
    updateData.status = status
  }

  if (Object.keys(updateData).length === 0) {
    badRequest('At least one updatable field is required')
  }

  const existingMemorial = await prisma.memorial.findFirst({
    where: useAdminAccess
      ? {
          id: memorialId,
          is_del: false
        }
      : {
          id: memorialId,
          contactEmail,
          is_del: false
        },
    select: {
      id: true,
      publishedAt: true
    }
  })

  if (!existingMemorial) {
    notFound('Memorial not found or email does not match')
  }

  if (updateData.status === 'PUBLISHED' && !existingMemorial.publishedAt) {
    updateData.publishedAt = new Date()
  }

  const memorial = await prisma.memorial.update({
    where: {
      id: memorialId
    },
    data: updateData,
    select: memorialSelect
  })

  return successResponse<UpdateMemorialResponseData>('Updated successfully', {
    memorial: toMemorialItem(memorial)
  })
})