export type MemorialStatus = 'PENDING' | 'PUBLISHED' | 'HIDDEN'

export type TributeActionType = 'TRIBUTE'

export type MemorialSortField = 'name' | 'createdAt' | 'updatedAt' | 'tributeCount'

export type SortDirection = 'asc' | 'desc'

export interface MemorialItem {
  id: number
  slug: string
  name: string
  description: string
  status: MemorialStatus
  tributeCount: number
  is_del: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface MemorialDetailItem extends MemorialItem {}

export interface PublicMemorialListItem extends MemorialItem {}