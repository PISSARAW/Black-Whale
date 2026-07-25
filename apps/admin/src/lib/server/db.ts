import { PrismaClient } from '@black-whale/database';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL || 'postgresql://henripissa@localhost:5432/blackwhale?schema=public';

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: databaseUrl,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

