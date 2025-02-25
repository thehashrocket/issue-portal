import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '@/app/api/users/route';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Mock the auth and prisma modules
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
    },
  },
}));

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock auth to return null (not authenticated)
    (auth as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json).toEqual({
          error: 'Unauthorized: You must be logged in',
        });
      },
    });
  });

  it('should return 403 if user is not an admin', async () => {
    // Mock auth to return a non-admin user
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: '123',
        role: 'USER',
      },
    });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json).toEqual({
          error: 'Forbidden: Admin access required',
        });
      },
    });
  });

  it('should return users if user is an admin', async () => {
    // Mock auth to return an admin user
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: '123',
        role: 'ADMIN',
      },
    });

    // Mock prisma to return sample users
    const mockUsers = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual({ users: mockUsers });
        expect(prisma.user.findMany).toHaveBeenCalledWith({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
    });
  });

  it('should handle errors and return 500', async () => {
    // Mock auth to return an admin user
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: '123',
        role: 'ADMIN',
      },
    });

    // Mock prisma to throw an error
    (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json).toEqual({
          error: 'Internal server error',
        });
      },
    });
  });
}); 