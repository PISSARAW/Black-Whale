import { PrismaClient } from '@black-whale/database';

// Vite reloads server modules on every edit in development. Without a global
// handle each reload constructs another client, and each client opens its own
// connection pool against Postgres. apps/admin already guards this the same way.
const globalPrisma = globalThis as unknown as { blackWhaleWebPrisma?: PrismaClient };

export const prisma = globalPrisma.blackWhaleWebPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalPrisma.blackWhaleWebPrisma = prisma;
