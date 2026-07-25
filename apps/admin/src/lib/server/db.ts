// Prisma database client
// Uses a CommonJS wrapper to handle @prisma/client

// Declare the CommonJS module
declare module './db.cjs' {
  export const prisma: any;
  export const PrismaClient: any;
  export const getPrismaInstance: () => any;
}

let prismaPromise: Promise<any> | null = null;

async function getPrismaClient(): Promise<any> {
  if (!prismaPromise) {
    // Import the CommonJS wrapper using dynamic import
    // Vite will handle this as an external module in SSR
    const module = await import('./db.cjs');
    prismaPromise = Promise.resolve(module.prisma);
  }
  return prismaPromise;
}

export async function getPrisma() {
  return await getPrismaClient();
}
