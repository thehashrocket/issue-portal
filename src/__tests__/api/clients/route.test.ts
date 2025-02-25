// Mock next/server before importing the handlers
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn().mockImplementation((body, options) => ({
      status: options?.status || 200,
      json: async () => body,
    })),
  },
}));

import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '@/app/api/clients/route';
import * as idHandler from '@/app/api/clients/[id]/route';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Mock the auth and prisma modules
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    issue: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    client: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Clients API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/clients', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(401);
          const json = await res.json();
          expect(json.error).toBe('Unauthorized');
        },
      });
    });

    it('should return 403 if user is not authorized to list clients', async () => {
      // Mock auth to return a user with insufficient permissions
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-id', role: 'USER' },
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(403);
          const json = await res.json();
          expect(json.error).toBe('Forbidden');
        },
      });
    });

    it('should return all clients for ADMIN users', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin-id', role: 'ADMIN' },
      });

      // Mock the prisma client response
      const mockClients = [
        { id: 'client-1', name: 'Client 1' },
        { id: 'client-2', name: 'Client 2' },
      ];
      (prisma as any).client.findMany.mockResolvedValue(mockClients);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.data).toEqual(mockClients);
        },
      });

      // Verify that findMany was called with the correct parameters
      expect((prisma as any).client.findMany).toHaveBeenCalledWith({
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    });

    it('should return only managed clients for ACCOUNT_MANAGER users', async () => {
      // Mock auth to return an account manager user
      const userId = 'account-manager-id';
      (auth as jest.Mock).mockResolvedValue({
        user: { id: userId, role: 'ACCOUNT_MANAGER' },
      });

      // Mock the prisma client response
      const mockClients = [
        { id: 'client-1', name: 'Client 1', managerId: userId },
      ];
      (prisma as any).client.findMany.mockResolvedValue(mockClients);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.data).toEqual(mockClients);
        },
      });

      // Verify that findMany was called with the correct parameters
      expect((prisma as any).client.findMany).toHaveBeenCalledWith({
        where: {
          managerId: userId,
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    });
  });

  describe('POST /api/clients', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'New Client' }),
          });
          expect(res.status).toBe(401);
          const json = await res.json();
          expect(json.error).toBe('Unauthorized');
        },
      });
    });

    it('should return 403 if user is not authorized to create clients', async () => {
      // Mock auth to return a user with insufficient permissions
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-id', role: 'USER' },
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'New Client' }),
          });
          expect(res.status).toBe(403);
          const json = await res.json();
          expect(json.error).toBe('Forbidden');
        },
      });
    });

    it('should create a client successfully for ADMIN users', async () => {
      // Mock auth to return an admin user
      const userId = 'admin-id';
      (auth as jest.Mock).mockResolvedValue({
        user: { id: userId, role: 'ADMIN' },
      });

      // Mock the prisma client response
      const mockClient = { 
        id: 'client-1', 
        name: 'New Client',
        primaryContact: 'John Doe',
        website: 'https://example.com',
        sla: '24/7 Support',
        notes: 'Important client',
        managerId: userId,
      };
      (prisma as any).client.create.mockResolvedValue(mockClient);

      const clientData = {
        name: 'New Client',
        primaryContact: 'John Doe',
        website: 'https://example.com',
        sla: '24/7 Support',
        notes: 'Important client',
      };

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData),
          });
          expect(res.status).toBe(201);
          const json = await res.json();
          expect(json.data).toEqual(mockClient);
          expect(json.message).toBe('Client created successfully');
        },
      });

      // Verify that create was called with the correct parameters
      expect((prisma as any).client.create).toHaveBeenCalledWith({
        data: {
          ...clientData,
          status: 'ACTIVE',
          managerId: userId,
        },
      });
    });
  });
}); 