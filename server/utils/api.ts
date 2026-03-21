import { createError } from 'h3'
import type { ApiResponse } from '~~/app/types/Response'
import type { MemorialStatus } from '~~/app/types/Item'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
const MEMORIAL_STATUSES: MemorialStatus[] = ['PENDING', 'PUBLISHED', 'HIDDEN']

export function successResponse<T>(message: string, data: T): ApiResponse<T> {
  return {
    success: true,
    message,
    data
  }
}

export function badRequest(statusMessage: string): never {
  throw createError({
    statusCode: 422,
    statusMessage
  })
}

export function notFound(statusMessage: string): never {
  throw createError({
    statusCode: 404,
    statusMessage
  })
}

export function forbidden(statusMessage: string): never {
  throw createError({
    statusCode: 403,
    statusMessage
  })
}

export function requireRouteParam(value: string | undefined, fieldName: string): string {
  if (!value?.trim()) {
    badRequest(`Missing route parameter: ${fieldName}`)
  }

  return value.trim()
}

export function requireIntegerRouteParam(value: string | undefined, fieldName: string): number {
  const normalizedValue = requireRouteParam(value, fieldName)
  const parsedValue = Number.parseInt(normalizedValue, 10)

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    badRequest(`${fieldName} must be a positive integer`)
  }

  return parsedValue
}

export function requireString(
  value: unknown,
  fieldName: string,
  options: {
    min?: number
    max?: number
  } = {}
): string {
  if (typeof value !== 'string') {
    badRequest(`${fieldName} must be a string`)
  }

  const trimmedValue = value.trim()
  const minLength = options.min ?? 1

  if (trimmedValue.length < minLength) {
    badRequest(`${fieldName} cannot be empty`)
  }

  if (options.max && trimmedValue.length > options.max) {
    badRequest(`${fieldName} must be at most ${options.max} characters`)
  }

  return trimmedValue
}

export function optionalString(
  value: unknown,
  fieldName: string,
  options: {
    max?: number
    allowNull?: boolean
  } = {}
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    if (options.allowNull) {
      return null
    }

    badRequest(`${fieldName} cannot be null`)
  }

  return requireString(value, fieldName, { max: options.max })
}

export function requireEmail(value: unknown, fieldName = 'contactEmail'): string {
  const email = requireString(value, fieldName, { max: 254 }).toLowerCase()

  if (!EMAIL_PATTERN.test(email)) {
    badRequest(`${fieldName} must be a valid email address`)
  }

  return email
}

export function optionalImageUrl(value: unknown): string | null | undefined {
  const imageUrl = optionalString(value, 'imageUrl', {
    max: 2048,
    allowNull: true
  })

  if (imageUrl === undefined || imageUrl === null) {
    return imageUrl
  }

  try {
    const url = new URL(imageUrl)

    if (!['http:', 'https:'].includes(url.protocol)) {
      badRequest('imageUrl must use http or https')
    }
  } catch {
    badRequest('imageUrl must be a valid URL')
  }

  return imageUrl
}

export function optionalMemorialStatus(value: unknown): MemorialStatus | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'string' || !MEMORIAL_STATUSES.includes(value as MemorialStatus)) {
    badRequest('status is invalid')
  }

  return value as MemorialStatus
}

export function getSingleQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined
  }

  return typeof value === 'string' ? value : undefined
}