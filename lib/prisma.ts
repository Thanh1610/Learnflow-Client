import { withAccelerate } from '@prisma/extension-accelerate';
import { PrismaClient } from '../app/generated/prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const accelerateUrl =
  process.env.PRISMA_ACCELERATE_URL ||
  (process.env.DATABASE_URL?.startsWith('prisma://')
    ? process.env.DATABASE_URL
    : undefined);

const fallbackUrl =
  process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';

const baseClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: accelerateUrl ?? fallbackUrl,
  });

const prisma = (
  accelerateUrl && process.env.PRISMA_ACCELERATE_ENABLED !== 'false'
    ? baseClient.$extends(withAccelerate())
    : baseClient
) as PrismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
