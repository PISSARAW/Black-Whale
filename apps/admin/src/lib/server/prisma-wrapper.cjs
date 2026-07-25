// CommonJS wrapper for Prisma Client
// This file uses require() to load @prisma/client which is a CommonJS module

const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://henripissa@localhost:5432/blackwhale?schema=public';

// Singleton pattern
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  datasourceUrl: databaseUrl,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma, PrismaClient, ...require('@prisma/client') };
