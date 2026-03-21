import { getQuery } from 'h3'
import prisma from '~~/server/utils/prisma'
import type { QueryMemorialsByEmailResponseData } from '~~/app/types/Response'
import { getSingleQueryValue, requireEmail, successResponse } from '../../utils/api'
import { isAdminEmail } from '../../utils/admin'
import { memorialSelect, toMemorialItem } from '../../utils/memorial'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const contactEmail = requireEmail(getSingleQueryValue(query.contactEmail))

  const memorials = await prisma.memorial.findMany({
    where: isAdminEmail(event, contactEmail)
      ? {}
      : {
          contactEmail
        },
    orderBy: [
      { is_del: 'asc' },
      { createdAt: 'desc' }
    ],
    select: memorialSelect
  })

  return successResponse<QueryMemorialsByEmailResponseData>('Query succeeded', {
    memorials: memorials.map(toMemorialItem)
  })
})