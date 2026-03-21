import type { MemorialSortField, MemorialStatus, SortDirection } from './Item'

export interface CreateMemorialRequest {
  name: string
  description: string
  contactEmail: string
  imageUrl?: string | null
  turnstileToken: string
}

export interface UpdateMemorialRequest {
  contactEmail: string
  name?: string
  description?: string
  imageUrl?: string | null
  status?: MemorialStatus
  turnstileToken: string
}

export interface DeleteMemorialRequest {
  contactEmail: string
  turnstileToken: string
}

export interface QueryMemorialsByEmailRequest {
  contactEmail: string
}

export interface CreateTributeRequest {
  turnstileToken: string
}

export interface SearchMemorialAccessRequest {
  contactEmail: string
  turnstileToken: string
}

export interface PublicMemorialListRequest {
  page?: number
  pageSize?: number
  sortField?: MemorialSortField
  sortDirection?: SortDirection
  keyword?: string
  mine?: boolean
  contactEmail?: string
  accessToken?: string
}