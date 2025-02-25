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

import * as idHandler from '@/app/api/clients/[id]/route';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
// testApiHandler is imported but not used in this file
// import { testApiHandler } from 'next-test-api-route-handler';

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

// Create a mock request
const createMockRequest = (method = 'GET', body = {}) => {
  return {
    method,
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn().mockReturnValue('application/json'),
    },
  };
};

describe('Client ID API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockClient = {
    id: 'client-1',
    name: 'Test Client',
    email: 'client@example.com',
    phone: '123-456-7890',
    address: '123 Main St',
    website: 'https://example.com',
    description: 'A test client',
    primaryContact: 'John Doe',
    sla: '24/7 Support',
    notes: 'Important client',
    status: 'ACTIVE',
    managerId: 'manager-id',
    manager: {
      id: 'manager-id',
      name: 'Manager',
      email: 'manager@example.com',
    },
  };

  describe('GET /api/clients/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest();
      const res = await idHandler.GET(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not authorized to view clients', async () => {
      // Mock auth to return a user with insufficient permissions
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-id', role: 'USER' },
      });

      const req = createMockRequest();
      const res = await idHandler.GET(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });

    it('should return 404 if client does not exist', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin-id', role: 'ADMIN' },
      });

      // Mock the prisma client response
      (prisma as any).client.findUnique.mockResolvedValue(null);

      const req = createMockRequest();
      const res = await idHandler.GET(req as any, { params: { id: 'non-existent-client' } });
      
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Client not found');
    });

    it('should return client for ADMIN users', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin-id', role: 'ADMIN' },
      });

      // Mock the prisma client response
      (prisma as any).client.findUnique.mockResolvedValue(mockClient);

      const req = createMockRequest();
      const res = await idHandler.GET(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual(mockClient);
    });

    it('should return 403 if ACCOUNT_MANAGER tries to view client they do not manage', async () => {
      // Mock auth to return an account manager user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'other-manager-id', role: 'ACCOUNT_MANAGER' },
      });

      // Mock the prisma client response
      (prisma as any).client.findUnique.mockResolvedValue(mockClient);

      const req = createMockRequest();
      const res = await idHandler.GET(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("You don't have permission to view this client");
    });
  });

  describe('PATCH /api/clients/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest('PATCH', { name: 'Updated Client' });
      const res = await idHandler.PATCH(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not authorized to update clients', async () => {
      // Mock auth to return a user with insufficient permissions
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-id', role: 'USER' },
      });

      const req = createMockRequest('PATCH', { name: 'Updated Client' });
      const res = await idHandler.PATCH(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });

    it('should update client successfully for ADMIN users', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin-id', role: 'ADMIN' },
      });

      // Mock the prisma client responses
      (prisma as any).client.findUnique.mockResolvedValue(mockClient);
      
      const updatedClient = {
        ...mockClient,
        name: 'Updated Client',
        primaryContact: 'Jane Doe',
      };
      (prisma as any).client.update.mockResolvedValue(updatedClient);

      const updateData = {
        name: 'Updated Client',
        primaryContact: 'Jane Doe',
      };

      const req = createMockRequest('PATCH', updateData);
      const res = await idHandler.PATCH(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual(updatedClient);
      expect(json.message).toBe('Client updated successfully');

      // Verify that update was called with the correct parameters
      expect((prisma as any).client.update).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        data: updateData,
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('DELETE /api/clients/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest('DELETE');
      const res = await idHandler.DELETE(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not authorized to delete clients', async () => {
      // Mock auth to return a user with insufficient permissions
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-id', role: 'USER' },
      });

      const req = createMockRequest('DELETE');
      const res = await idHandler.DELETE(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });

    it('should soft delete client successfully for ADMIN users', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin-id', role: 'ADMIN' },
      });

      // Mock the prisma client responses
      (prisma as any).client.findUnique.mockResolvedValue(mockClient);
      
      const updatedClient = {
        ...mockClient,
        status: 'INACTIVE',
      };
      (prisma as any).client.update.mockResolvedValue(updatedClient);

      const req = createMockRequest('DELETE');
      const res = await idHandler.DELETE(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual({ id: 'client-1' });
      expect(json.message).toBe('Client soft deleted successfully');

      // Verify that update was called with the correct parameters
      expect((prisma as any).client.update).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        data: {
          status: 'INACTIVE',
        },
      });
    });

    it('should allow ACCOUNT_MANAGER to soft delete their own clients', async () => {
      // Mock auth to return an account manager user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'manager-id', role: 'ACCOUNT_MANAGER' },
      });

      // Mock the prisma client responses
      (prisma as any).client.findUnique.mockResolvedValue(mockClient);
      
      const updatedClient = {
        ...mockClient,
        status: 'INACTIVE',
      };
      (prisma as any).client.update.mockResolvedValue(updatedClient);

      const req = createMockRequest('DELETE');
      const res = await idHandler.DELETE(req as any, { params: { id: 'client-1' } });
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual({ id: 'client-1' });
      expect(json.message).toBe('Client soft deleted successfully');
    });
  });
}); 