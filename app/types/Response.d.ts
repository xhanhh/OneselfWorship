import type {
  MemorialDetailItem,
  MemorialItem,
  MemorialSortField,
  PublicMemorialListItem,
  SortDirection
} from './Item'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface CreateMemorialResponseData {
  memorial: MemorialItem
}

export interface QueryMemorialsByEmailResponseData {
  memorials: MemorialItem[]
}

export interface GetMemorialDetailResponseData {
  memorial: MemorialDetailItem
}

export interface UpdateMemorialResponseData {
  memorial: MemorialItem
}

export interface DeleteMemorialResponseData {
  memorial: MemorialItem
}

export interface CreateTributeResponseData {
  memorial: MemorialDetailItem
  tributeCount: number
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  sortField: MemorialSortField
  sortDirection: SortDirection
}

export interface PublicMemorialListResponseData {
  memorials: PublicMemorialListItem[]
  pagination: PaginationMeta
}