import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

// Define a custom type that includes the Issue and File models
type PrismaClientWithIssue = PrismaClient & {
  issue: any;
  file: any;
};

// Add issue model to the global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientWithIssue | undefined;
}

const globalForPrisma = global as unknown as { prisma: PrismaClientWithIssue };

export const prisma =
  globalForPrisma.prisma ||
  (new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }) as PrismaClientWithIssue);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 