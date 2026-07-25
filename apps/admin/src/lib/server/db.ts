// Prisma client instance
// Uses a CommonJS wrapper to handle @prisma/client which is a CommonJS module

import type { PrismaClient } from '@prisma/client';

let prismaPromise: Promise<any> | null = null;

async function getPrismaClient(): Promise<any> {
  if (!prismaPromise) {
    // Import the CommonJS wrapper
    // Note: This uses dynamic import to load the CommonJS module
    const module = await import('./prisma-wrapper.cjs');
    prismaPromise = Promise.resolve(module.prisma);
  }
  return prismaPromise;
}

export async function getPrisma() {
  return await getPrismaClient();
}

// Export types
export type { PrismaClient };
