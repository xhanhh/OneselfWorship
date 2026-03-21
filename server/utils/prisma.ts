import path from 'node:path'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import prismaClient from '@prisma/client'

const { PrismaClient } = prismaClient

const prismaClientSingleton = () => {
  const adapter = new PrismaBetterSqlite3({
    url: resolveSqliteDatabaseUrl(process.env.DATABASE_URL)
  })

  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

function resolveSqliteDatabaseUrl(databaseUrl?: string) {
  const normalizedUrl = databaseUrl?.trim() || 'file:./dev.db'

  if (!normalizedUrl.startsWith('file:')) {
    throw new Error('DATABASE_URL must use the sqlite file: protocol.')
  }

  const databasePath = normalizedUrl.slice('file:'.length)

  if (!databasePath) {
    throw new Error('DATABASE_URL must include a sqlite file path.')
  }

  if (path.isAbsolute(databasePath)) {
    return `file:${databasePath}`
  }

  return `file:${path.resolve(process.cwd(), databasePath)}`
}
