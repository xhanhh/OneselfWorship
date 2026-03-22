import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaClient } from '~~/app/generated/prisma/client'

const prismaClientSingleton = () => new PrismaClient({
  accelerateUrl: resolveAccelerateUrl()
}).$extends(withAccelerate())

declare const globalThis: {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

function resolveAccelerateUrl() {
  const accelerateUrl = process.env.DATABASE_URL

  if (!accelerateUrl?.trim()) {
    throw new Error(
      'Missing Prisma Accelerate URL. Set DATABASE_URL to the prisma:// URL from Prisma Accelerate.'
    )
  }

  return accelerateUrl
}
