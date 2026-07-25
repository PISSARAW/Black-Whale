// CommonJS wrapper for Prisma Client
// This file can use require() to load @prisma/client

const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://henripissa@localhost:5432/blackwhale?schema=public';

// Singleton pattern
let prismaInstance = null;

function getPrismaInstance() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasourceUrl: databaseUrl,
    });
    
    if (process.env.NODE_ENV !== 'production') {
      global.prisma = prismaInstance;
    }
  }
  return prismaInstance;
}

module.exports = { 
  prisma: getPrismaInstance(),
  PrismaClient,
  getPrismaInstance
};
