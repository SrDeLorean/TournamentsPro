let prismaClient: any;

try {
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = global as unknown as { prisma: any };
  prismaClient = globalForPrisma.prisma || new PrismaClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient;
} catch (e) {
  prismaClient = null;
}

export const prisma = prismaClient;
