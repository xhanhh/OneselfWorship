import { getRouterParam } from 'h3'
import prisma from '~~/server/utils/prisma'
import type { GetMemorialDetailResponseData } from '~~/app/types/Response'
import { notFound, requireIntegerRouteParam, successResponse } from '../../utils/api'
import { memorialSelect, toMemorialDetailItem } from '../../utils/memorial'

export default defineEventHandler(async (event) => {
  const id = requireIntegerRouteParam(getRouterParam(event, 'id'), 'id')

  const memorial = await prisma.memorial.findFirst({
    where: {
      id,
      status: 'PUBLISHED',
      is_del: false
    },
    select: memorialSelect
  })

  if (!memorial) {
    notFound('Memorial not found')
  }

  return successResponse<GetMemorialDetailResponseData>('Query succeeded', {
    memorial: toMemorialDetailItem(memorial)
  })
})