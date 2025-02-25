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
import * as issueCommentsHandler from '@/app/api/issues/[id]/comments/route';
import * as commentDeleteHandler from '@/app/api/comments/[id]/route';
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
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  },
}));

describe('Comments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/issues/[id]/comments', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler: issueCommentsHandler,
        paramsPatcher: (params) => {
          params.id = '123';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(401);
          const json = await res.json();
          expect(json).toEqual({
            error: 'Unauthorized: Authentication required',
          });
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

      // Mock prisma to return null for issue
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler: issueCommentsHandler,
        paramsPatcher: (params) => {
          params.id = '123';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(404);
          const json = await res.json();
          expect(json).toEqual({
            error: 'Issue not found',
          });
        },
      });
    });

    it('should return comments for an issue', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return an issue
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        reportedById: '123',
        assignedToId: null,
      });

      // Mock comments
      const mockComments = [
        {
          id: '1',
          text: 'Test comment 1',
          createdById: '123',
          issueId: '123',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com',
            image: null,
          },
        },
      ];

      // Mock transaction to return comments
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          $queryRaw: jest.fn().mockResolvedValue(mockComments),
        });
      });

      await testApiHandler({
        appHandler: issueCommentsHandler,
        paramsPatcher: (params) => {
          params.id = '123';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.data).toEqual(mockComments);
        },
      });
    });
  });

  describe('POST /api/issues/[id]/comments', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler: issueCommentsHandler,
        paramsPatcher: (params) => {
          params.id = '123';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'POST',
            body: JSON.stringify({ text: 'Test comment' }),
          });
          expect(res.status).toBe(401);
          const json = await res.json();
          expect(json).toEqual({
            error: 'Unauthorized: Authentication required',
          });
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

      // Mock prisma to return null for issue
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler: issueCommentsHandler,
        paramsPatcher: (params) => {
          params.id = '123';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'POST',
            body: JSON.stringify({ text: 'Test comment' }),
          });
          expect(res.status).toBe(404);
          const json = await res.json();
          expect(json).toEqual({
            error: 'Issue not found',
          });
        },
      });
    });

    it('should create a comment for an issue', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return an issue
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        reportedById: '456',
        assignedToId: null,
      });

      // Mock created comment
      const mockComment = {
        id: '1',
        text: 'Test comment',
        createdById: '123',
        issueId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: {
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
      };

      // Mock transaction to return created comment
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          $executeRaw: jest.fn().mockResolvedValue(undefined),
          $queryRaw: jest.fn().mockResolvedValue([mockComment]),
        });
      });

      await testApiHandler({
        appHandler: issueCommentsHandler,
        paramsPatcher: (params) => {
          params.id = '123';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'POST',
            body: JSON.stringify({ text: 'Test comment' }),
          });
          expect(res.status).toBe(201);
          const json = await res.json();
          expect(json.data).toEqual(mockComment);
          expect(json.message).toBe('Comment created successfully');
        },
      });
    });

    it('should return 400 if validation fails', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      await testApiHandler({
        appHandler: issueCommentsHandler,
        paramsPatcher: (params) => {
          params.id = '123';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'POST',
            body: JSON.stringify({ text: '' }), // Empty text should fail validation
          });
          expect(res.status).toBe(400);
          const json = await res.json();
          expect(json.error).toBe('Validation failed');
        },
      });
    });
  });

  describe('DELETE /api/comments/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler: commentDeleteHandler,
        paramsPatcher: (params) => {
          params.id = '123';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'DELETE' });
          expect(res.status).toBe(401);
          const json = await res.json();
          expect(json).toEqual({
            error: 'Unauthorized',
          });
        },
      });
    });

    it('should return 404 if comment does not exist', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return empty array for comment query
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      await testApiHandler({
        appHandler: commentDeleteHandler,
        paramsPatcher: (params) => {
          params.id = '123';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'DELETE' });
          expect(res.status).toBe(404);
          const json = await res.json();
          expect(json).toEqual({
            error: 'Comment not found',
          });
        },
      });
    });

    it('should return 403 if user is not authorized to delete the comment', async () => {
      // Mock auth to return a regular user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return a comment created by a different user
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{
        id: '1',
        createdById: '456', // Different user ID
      }]);

      await testApiHandler({
        appHandler: commentDeleteHandler,
        paramsPatcher: (params) => {
          params.id = '1';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'DELETE' });
          expect(res.status).toBe(403);
          const json = await res.json();
          expect(json.error).toContain('You don\'t have permission');
        },
      });
    });

    it('should delete a comment if user is the creator', async () => {
      // Mock auth to return a user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'USER',
        },
      });

      // Mock prisma to return a comment created by the same user
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{
        id: '1',
        createdById: '123', // Same user ID
      }]);

      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          $executeRaw: jest.fn().mockResolvedValue(undefined),
        });
      });

      await testApiHandler({
        appHandler: commentDeleteHandler,
        paramsPatcher: (params) => {
          params.id = '1';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'DELETE' });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.data).toEqual({ id: '1' });
          expect(json.message).toBe('Comment deleted successfully');
        },
      });
    });

    it('should delete a comment if user is an admin', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: '123',
          role: 'ADMIN',
        },
      });

      // Mock prisma to return a comment created by a different user
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{
        id: '1',
        createdById: '456', // Different user ID
      }]);

      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          $executeRaw: jest.fn().mockResolvedValue(undefined),
        });
      });

      await testApiHandler({
        appHandler: commentDeleteHandler,
        paramsPatcher: (params) => {
          params.id = '1';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'DELETE' });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.data).toEqual({ id: '1' });
          expect(json.message).toBe('Comment deleted successfully');
        },
      });
    });
  });
}); 