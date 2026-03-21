import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import prisma from '~~/server/utils/prisma'
import type { MemorialSortField, SortDirection } from '~~/app/types/Item'
import type { PublicMemorialListResponseData } from '~~/app/types/Response'
import { getSingleQueryValue, requireEmail, requireString, successResponse } from '../../utils/api'
import { isAdminEmail } from '../../utils/admin'
import { assertMemorialSearchAccessToken } from '../../utils/memorial-search-access'
import { memorialSelect, toMemorialItem } from '../../utils/memorial'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 48
const SORT_FIELDS: MemorialSortField[] = ['name', 'createdAt', 'updatedAt', 'tributeCount']
const SORT_DIRECTIONS: SortDirection[] = ['asc', 'desc']

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const requestedPage = parsePositiveInteger(getSingleQueryValue(query.page), DEFAULT_PAGE)
  const requestedPageSize = parsePositiveInteger(getSingleQueryValue(query.pageSize), DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const sortField = parseSortField(getSingleQueryValue(query.sortField))
  const sortDirection = parseSortDirection(getSingleQueryValue(query.sortDirection))
  const keyword = getKeyword(getSingleQueryValue(query.keyword))
  const mine = getSingleQueryValue(query.mine) === 'true'

  const where = mine
    ? buildMineWhere(event, getSingleQueryValue(query.contactEmail), getSingleQueryValue(query.accessToken))
    : buildPublicWhere(keyword)

  const total = await prisma.memorial.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)

  const memorials = await prisma.memorial.findMany({
    where,
    orderBy: buildOrderBy(sortField, sortDirection),
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: memorialSelect
  })

  return successResponse<PublicMemorialListResponseData>('Query succeeded', {
    memorials: memorials.map(toMemorialItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      sortField,
      sortDirection
    }
  })
})

function buildPublicWhere(keyword: string | undefined) {
  if (!keyword) {
    return {
      status: 'PUBLISHED' as const,
      is_del: false
    }
  }

  return {
    status: 'PUBLISHED' as const,
    is_del: false,
    OR: [
      {
        name: {
          contains: keyword
        }
      },
      {
        description: {
          contains: keyword
        }
      }
    ]
  }
}

function buildMineWhere(event: H3Event, contactEmailValue: string | undefined, accessTokenValue: string | undefined) {
  const contactEmail = requireEmail(contactEmailValue)
  const accessToken = requireString(accessTokenValue, 'accessToken', { max: 4096 })

  assertMemorialSearchAccessToken(event, accessToken, contactEmail)

  if (isAdminEmail(event, contactEmail)) {
    return {
      is_del: false
    }
  }

  return {
    contactEmail,
    is_del: false
  }
}

function parsePositiveInteger(value: string | undefined, fallbackValue: number) {
  if (!value) {
    return fallbackValue
  }

  const parsedValue = Number.parseInt(value, 10)

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallbackValue
  }

  return parsedValue
}

function parseSortField(value: string | undefined): MemorialSortField {
  if (!value || !SORT_FIELDS.includes(value as MemorialSortField)) {
    return 'createdAt'
  }

  return value as MemorialSortField
}

function parseSortDirection(value: string | undefined): SortDirection {
  if (!value || !SORT_DIRECTIONS.includes(value as SortDirection)) {
    return 'desc'
  }

  return value as SortDirection
}

function getKeyword(value: string | undefined) {
  const normalizedValue = value?.trim()

  return normalizedValue ? normalizedValue.slice(0, 100) : undefined
}

function buildOrderBy(sortField: MemorialSortField, sortDirection: SortDirection) {
  switch (sortField) {
    case 'name':
      return [
        { name: sortDirection },
        { createdAt: 'desc' as const }
      ]
    case 'updatedAt':
      return [
        { updatedAt: sortDirection },
        { createdAt: 'desc' as const }
      ]
    case 'tributeCount':
      return [
        { tributeCount: sortDirection },
        { updatedAt: 'desc' as const }
      ]
    case 'createdAt':
    default:
      return [
        { createdAt: sortDirection },
        { updatedAt: 'desc' as const }
      ]
  }
}