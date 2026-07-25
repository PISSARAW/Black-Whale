// Prisma database client
// Uses dynamic import to handle CommonJS @prisma/client module

let prismaPromise: Promise<any> | null = null;

export async function getPrisma() {
  if (!prismaPromise) {
    const { PrismaClient } = await import('@prisma/client');
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://henripissa@localhost:5432/blackwhale?schema=public';
    
    prismaPromise = Promise.resolve(new PrismaClient({ datasourceUrl: databaseUrl }));
  }
  return await prismaPromise;
}
