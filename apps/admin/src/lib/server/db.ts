import { PrismaClient } from '@black-whale/database';

const globalPrisma = globalThis as unknown as { blackWhaleAdminPrisma?: PrismaClient };
const prisma = globalPrisma.blackWhaleAdminPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalPrisma.blackWhaleAdminPrisma = prisma;

export async function getPrisma(): Promise<PrismaClient> {
  return prisma;
}
