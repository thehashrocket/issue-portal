import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

// Initialize Prisma client with proper type casting
const prisma = new PrismaClient() as any;

// Helper function to measure execution time
async function measureExecutionTime(callback: () => Promise<any>): Promise<number> {
  const start = performance.now();
  await callback();
  const end = performance.now();
  return end - start;
}

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

describe('API Performance Tests', () => {
  // Test issue queries
  describe('Issue Queries', () => {
    test('Compare performance of indexed vs non-indexed status queries', async () => {
      // Query with indexed status field
      const indexedTime = await measureExecutionTime(async () => {
        await prisma.issue.findMany({
          where: { status: 'NEW' },
          select: {
            id: true,
            title: true,
            status: true,
          },
          take: 100,
        });
      });
      
      // Simulate non-indexed query by using a complex where condition
      // This forces Prisma to not use the index
      const nonIndexedTime = await measureExecutionTime(async () => {
        await prisma.issue.findMany({
          where: {
            OR: [
              { status: 'NEW' },
              { status: 'NEW', title: { contains: '' } },
            ]
          },
          select: {
            id: true,
            title: true,
            status: true,
          },
          take: 100,
        });
      });
      
      console.log(`Indexed status query: ${indexedTime.toFixed(2)}ms`);
      console.log(`Non-indexed status query: ${nonIndexedTime.toFixed(2)}ms`);
      console.log(`Performance improvement: ${((nonIndexedTime - indexedTime) / nonIndexedTime * 100).toFixed(2)}%`);
      
      // The indexed query should be faster
      expect(indexedTime).toBeLessThan(nonIndexedTime);
    });
    
    test('Compare performance of select vs include', async () => {
      // Using select (optimized)
      const selectTime = await measureExecutionTime(async () => {
        await prisma.issue.findMany({
          where: { status: 'NEW' },
          select: {
            id: true,
            title: true,
            status: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 100,
        });
      });
      
      // Using include (less optimized)
      const includeTime = await measureExecutionTime(async () => {
        await prisma.issue.findMany({
          where: { status: 'NEW' },
          include: {
            assignedTo: true,
          },
          take: 100,
        });
      });
      
      console.log(`Select query: ${selectTime.toFixed(2)}ms`);
      console.log(`Include query: ${includeTime.toFixed(2)}ms`);
      console.log(`Performance improvement: ${((includeTime - selectTime) / includeTime * 100).toFixed(2)}%`);
      
      // The select query should be faster
      expect(selectTime).toBeLessThan(includeTime);
    });
    
    test('Compare performance of paginated vs non-paginated queries', async () => {
      // Paginated query
      const paginatedTime = await measureExecutionTime(async () => {
        await prisma.issue.findMany({
          skip: 0,
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
          },
        });
      });
      
      // Non-paginated query
      const nonPaginatedTime = await measureExecutionTime(async () => {
        await prisma.issue.findMany({
          select: {
            id: true,
            title: true,
            status: true,
          },
        });
      });
      
      console.log(`Paginated query: ${paginatedTime.toFixed(2)}ms`);
      console.log(`Non-paginated query: ${nonPaginatedTime.toFixed(2)}ms`);
      console.log(`Performance improvement: ${((nonPaginatedTime - paginatedTime) / nonPaginatedTime * 100).toFixed(2)}%`);
      
      // The paginated query should be faster
      expect(paginatedTime).toBeLessThan(nonPaginatedTime);
    });
  });
  
  // Test client queries
  describe('Client Queries', () => {
    test('Compare performance of indexed vs non-indexed status queries', async () => {
      // Query with indexed status field
      const indexedTime = await measureExecutionTime(async () => {
        await prisma.client.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            status: true,
          },
          take: 100,
        });
      });
      
      // Simulate non-indexed query
      const nonIndexedTime = await measureExecutionTime(async () => {
        await prisma.client.findMany({
          where: {
            OR: [
              { status: 'ACTIVE' },
              { status: 'ACTIVE', name: { contains: '' } },
            ]
          },
          select: {
            id: true,
            name: true,
            status: true,
          },
          take: 100,
        });
      });
      
      console.log(`Indexed status query: ${indexedTime.toFixed(2)}ms`);
      console.log(`Non-indexed status query: ${nonIndexedTime.toFixed(2)}ms`);
      console.log(`Performance improvement: ${((nonIndexedTime - indexedTime) / nonIndexedTime * 100).toFixed(2)}%`);
      
      // The indexed query should be faster
      expect(indexedTime).toBeLessThan(nonIndexedTime);
    });
    
    test('Compare performance of select vs include', async () => {
      // Using select (optimized)
      const selectTime = await measureExecutionTime(async () => {
        await prisma.client.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            status: true,
            manager: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 100,
        });
      });
      
      // Using include (less optimized)
      const includeTime = await measureExecutionTime(async () => {
        await prisma.client.findMany({
          where: { status: 'ACTIVE' },
          include: {
            manager: true,
          },
          take: 100,
        });
      });
      
      console.log(`Select query: ${selectTime.toFixed(2)}ms`);
      console.log(`Include query: ${includeTime.toFixed(2)}ms`);
      console.log(`Performance improvement: ${((includeTime - selectTime) / includeTime * 100).toFixed(2)}%`);
      
      // The select query should be faster
      expect(selectTime).toBeLessThan(includeTime);
    });
  });
}); 