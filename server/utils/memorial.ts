import prisma from '~~/server/utils/prisma'
import type { MemorialDetailItem, MemorialItem } from '~~/app/types/Item'

type MemorialRecord = {
  id: number
  slug: string
  name: string
  description: string
  status: 'PENDING' | 'PUBLISHED' | 'HIDDEN'
  tributeCount: number
  is_del: boolean
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
}

export const memorialSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  status: true,
  tributeCount: true,
  is_del: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true
} as const

export function toMemorialItem(memorial: MemorialRecord): MemorialItem {
  return {
    ...memorial,
    imageUrl: memorial.imageUrl ?? null,
    createdAt: memorial.createdAt.toISOString(),
    updatedAt: memorial.updatedAt.toISOString(),
    publishedAt: memorial.publishedAt?.toISOString() ?? null
  }
}

export function toMemorialDetailItem(memorial: MemorialRecord): MemorialDetailItem {
  return toMemorialItem(memorial)
}

export async function generateUniqueMemorialSlug(name: string) {
  const baseSlug = slugifyMemorialName(name)

  let slug = baseSlug
  let suffix = 2

  while (await prisma.memorial.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return slug
}

function slugifyMemorialName(name: string) {
  const normalizedSlug = name
    .trim()
    .normalize('NFKC')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)

  return normalizedSlug || 'memorial'
}