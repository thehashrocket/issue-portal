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
import * as appHandler from '@/app/api/issues/route';
import * as idHandler from '@/app/api/issues/[id]/route';
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
  },
}));

describe('Issues API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/issues', () => {
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
            error: 'Unauthorized',
          });
        },
      });
    });

    it('should return issues for admin users', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'ADMIN',
        },
      });

      // Mock prisma to return sample issues
      const mockIssues = [
        {
          id: '1',
          title: 'Test Issue 1',
          description: 'Description 1',
          status: 'OPEN',
          priority: 'HIGH',
          assignedToId: '456',
          reportedById: '123',
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedTo: {
            id: '456',
            name: 'Assigned User',
            email: 'assigned@example.com',
          },
          reportedBy: {
            id: '123',
            name: 'Admin User',
            email: 'admin@example.com',
          },
        },
      ];

      (prisma.issue.findMany as jest.Mock).mockResolvedValue(mockIssues);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json).toEqual(mockIssues);
          expect(prisma.issue.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              orderBy: {
                updatedAt: 'desc',
              },
            })
          );
        },
      });
    });

    it('should filter issues for non-admin users', async () => {
      // Mock auth to return a regular user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return filtered issues
      const mockIssues = [
        {
          id: '1',
          title: 'Test Issue 1',
          description: 'Description 1',
          status: 'OPEN',
          priority: 'HIGH',
          assignedToId: '123',
          reportedById: '456',
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedTo: {
            id: '123',
            name: 'Regular User',
            email: 'user@example.com',
          },
          reportedBy: {
            id: '456',
            name: 'Another User',
            email: 'another@example.com',
          },
        },
      ];

      (prisma.issue.findMany as jest.Mock).mockResolvedValue(mockIssues);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json).toEqual(mockIssues);
          expect(prisma.issue.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: {
                OR: [
                  { reportedById: '123' },
                  { assignedToId: '123' }
                ]
              },
            })
          );
        },
      });
    });
  });

  describe('POST /api/issues', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'New Issue',
              description: 'Description',
              priority: 'HIGH',
            }),
          });
          expect(res.status).toBe(401);
        },
      });
    });

    it('should create a new issue with valid data', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      const newIssue = {
        id: '1',
        title: 'New Issue',
        description: 'Description',
        status: 'OPEN',
        priority: 'HIGH',
        assignedToId: null,
        reportedById: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedTo: null,
        reportedBy: {
          id: '123',
          name: 'User',
          email: 'user@example.com',
        },
      };

      (prisma.issue.create as jest.Mock).mockResolvedValue(newIssue);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'New Issue',
              description: 'Description',
              priority: 'HIGH',
            }),
          });
          expect(res.status).toBe(201);
          const json = await res.json();
          expect(json).toEqual(newIssue);
          expect(prisma.issue.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: {
                title: 'New Issue',
                description: 'Description',
                priority: 'HIGH',
                status: 'OPEN',
                assignedToId: undefined,
                reportedById: '123',
              },
            })
          );
        },
      });
    });

    it('should return 400 with invalid data', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // Missing required title
              description: 'Description',
              priority: 'HIGH',
            }),
          });
          expect(res.status).toBe(400);
          const json = await res.json();
          expect(json.error).toBe('Validation failed');
        },
      });
    });
  });

  describe('GET /api/issues/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler: {
          ...idHandler,
          params: { id: '1' },
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(401);
        },
      });
    });

    it('should return 404 if issue does not exist', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return null (issue not found)
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler: {
          ...idHandler,
          params: { id: '999' },
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(404);
          const json = await res.json();
          expect(json.error).toBe('Issue not found');
        },
      });
    });

    it('should return issue if user has permission', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return an issue
      const mockIssue = {
        id: '1',
        title: 'Test Issue',
        description: 'Description',
        status: 'OPEN',
        priority: 'HIGH',
        assignedToId: null,
        reportedById: '123', // Reported by the current user
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedTo: null,
        reportedBy: {
          id: '123',
          name: 'User',
          email: 'user@example.com',
        },
      };

      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockIssue);

      await testApiHandler({
        appHandler: {
          ...idHandler,
          params: { id: '1' },
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json).toEqual(mockIssue);
        },
      });
    });
  });

  describe('PUT /api/issues/[id]', () => {
    it('should update issue with valid data', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return an existing issue
      const existingIssue = {
        id: '1',
        title: 'Old Title',
        description: 'Old Description',
        status: 'OPEN',
        priority: 'MEDIUM',
        assignedToId: null,
        reportedById: '123', // Reported by the current user
      };

      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(existingIssue);

      // Mock prisma to return the updated issue
      const updatedIssue = {
        ...existingIssue,
        title: 'Updated Title',
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      };

      (prisma.issue.update as jest.Mock).mockResolvedValue(updatedIssue);

      await testApiHandler({
        appHandler: {
          ...idHandler,
          params: { id: '1' },
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Updated Title',
              status: 'IN_PROGRESS',
            }),
          });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json).toEqual(updatedIssue);
          expect(prisma.issue.update).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { id: '1' },
              data: {
                title: 'Updated Title',
                status: 'IN_PROGRESS',
              },
            })
          );
        },
      });
    });
  });

  describe('DELETE /api/issues/[id]', () => {
    it('should delete issue if user has permission', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return an existing issue
      const existingIssue = {
        id: '1',
        title: 'Test Issue',
        reportedById: '123', // Reported by the current user
      };

      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(existingIssue);
      (prisma.issue.delete as jest.Mock).mockResolvedValue({});

      await testApiHandler({
        appHandler: {
          ...idHandler,
          params: { id: '1' },
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'DELETE' });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json).toEqual({ success: true });
          expect(prisma.issue.delete).toHaveBeenCalledWith({
            where: { id: '1' },
          });
        },
      });
    });

    it('should return 403 if user does not have permission', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return an issue reported by someone else
      const existingIssue = {
        id: '1',
        title: 'Test Issue',
        reportedById: '456', // Reported by a different user
        assignedToId: '123', // Assigned to current user, but that's not enough for deletion
      };

      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(existingIssue);

      await testApiHandler({
        appHandler: {
          ...idHandler,
          params: { id: '1' },
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'DELETE' });
          expect(res.status).toBe(403);
          const json = await res.json();
          expect(json.error).toBe('Forbidden');
          expect(prisma.issue.delete).not.toHaveBeenCalled();
        },
      });
    });
  });
}); 