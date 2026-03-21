import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '~~/app/generated/prisma/client'

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: resolveDatabaseUrl()
  })

  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

function resolveDatabaseUrl() {
  const databaseUrl = process.env.POSTGRES_PRISMA_URL
    ?? process.env.POSTGRES_URL
    ?? process.env.DATABASE_URL

  if (!databaseUrl?.trim()) {
    throw new Error(
      'Missing database URL. Set POSTGRES_PRISMA_URL (recommended on Vercel + Supabase) or DATABASE_URL.'
    )
  }

  return databaseUrl
}
