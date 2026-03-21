import { createHash } from 'node:crypto'
import { getRequestHeader, getRequestIP, getRouterParam, readBody } from 'h3'
import prisma from '~~/server/utils/prisma'
import type { CreateTributeRequest } from '~~/app/types/Request'
import type { CreateTributeResponseData } from '~~/app/types/Response'
import { notFound, requireIntegerRouteParam, successResponse } from '#server/utils/api'
import { memorialSelect, toMemorialDetailItem } from '#server/utils/memorial'
import { assertTurnstileToken } from '#server/utils/turnstile'

export default defineEventHandler(async (event) => {
  const id = requireIntegerRouteParam(getRouterParam(event, 'id'), 'id')
  const body = await readBody<Partial<CreateTributeRequest>>(event)

  await assertTurnstileToken(body?.turnstileToken)

  const targetMemorial = await prisma.memorial.findFirst({
    where: {
      id,
      status: 'PUBLISHED',
      is_del: false
    },
    select: {
      id: true
    }
  })

  if (!targetMemorial) {
    notFound('Memorial not found')
  }

  const userAgent = getRequestHeader(event, 'user-agent') || null
  const ipAddress = getRequestIP(event, { xForwardedFor: true })
  const ipHash = ipAddress
    ? createHash('sha256').update(ipAddress).digest('hex')
    : null

  const [, memorial] = await prisma.$transaction([
    prisma.tribute.create({
      data: {
        memorialId: targetMemorial.id,
        actionType: 'TRIBUTE',
        ipHash,
        userAgent
      }
    }),
    prisma.memorial.update({
      where: {
        id: targetMemorial.id
      },
      data: {
        tributeCount: {
          increment: 1
        }
      },
      select: memorialSelect
    })
  ])

  return successResponse<CreateTributeResponseData>('Tribute created successfully', {
    memorial: toMemorialDetailItem(memorial),
    tributeCount: memorial.tributeCount
  })
})