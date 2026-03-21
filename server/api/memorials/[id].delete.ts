import { getRouterParam, readBody } from 'h3'
import prisma from '~~/server/utils/prisma'
import type { DeleteMemorialRequest } from '~~/app/types/Request'
import type { DeleteMemorialResponseData } from '~~/app/types/Response'
import { notFound, requireEmail, requireIntegerRouteParam, successResponse } from '../../utils/api'
import { isAdminEmail } from '../../utils/admin'
import { memorialSelect, toMemorialItem } from '../../utils/memorial'
import { assertTurnstileToken } from '../../utils/turnstile'

export default defineEventHandler(async (event) => {
  const memorialId = requireIntegerRouteParam(getRouterParam(event, 'id'), 'id')
  const body = await readBody<Partial<DeleteMemorialRequest>>(event)
  const contactEmail = requireEmail(body?.contactEmail)
  const useAdminAccess = isAdminEmail(event, contactEmail)

  await assertTurnstileToken(body?.turnstileToken)

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
      id: true
    }
  })

  if (!existingMemorial) {
    notFound('Memorial not found or email does not match')
  }

  const memorial = await prisma.memorial.update({
    where: {
      id: memorialId
    },
    data: {
      is_del: true
    },
    select: memorialSelect
  })

  return successResponse<DeleteMemorialResponseData>('Deleted successfully', {
    memorial: toMemorialItem(memorial)
  })
})