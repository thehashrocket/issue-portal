import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

// Define a custom type that includes the Issue and File models
type PrismaClientWithIssue = PrismaClient & {
  issue: PrismaClient['issue'];
  file: PrismaClient['file'];
  notification: PrismaClient['notification'];
};

// Add issue model to the global type
declare global {
  var prisma: PrismaClientWithIssue | undefined;
}

const globalForPrisma = global as unknown as { prisma: PrismaClientWithIssue };

// Debug database URL in production (without exposing sensitive data)
const debugDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      // Only log the protocol and host for debugging
      const urlParts = dbUrl.split('@');
      if (urlParts.length > 1) {
        const hostPart = urlParts[1];
        console.log(`[Prisma Debug] Database URL protocol: ${dbUrl.split('://')[0]}://`);
        console.log(`[Prisma Debug] Database host: ${hostPart.split('/')[0]}`);
      }
    } else {
      console.error('[Prisma Debug] DATABASE_URL is not set');
    }
  }
};

// Ensure we have a valid database URL
const getDatabaseUrl = (): string => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // If the URL is already in the correct format, use it
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return dbUrl;
  }
  
  // If somehow we get a prisma:// URL, we need to convert it or handle it
  if (dbUrl.startsWith('prisma://') || dbUrl.startsWith('prisma+postgres://')) {
    console.error('[Prisma Debug] Detected Data Platform URL format, but we need standard PostgreSQL URL');
    throw new Error('Invalid database URL format. Expected postgresql:// or postgres://, got: ' + dbUrl.split('://')[0]);
  }
  
  return dbUrl;
};

// Initialize Prisma client with proper configuration
const createPrismaClient = (): PrismaClientWithIssue => {
  debugDatabaseUrl();
  
  const databaseUrl = getDatabaseUrl();
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  }) as PrismaClientWithIssue;
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 