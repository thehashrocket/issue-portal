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
import * as assignHandler from '@/app/api/issues/[id]/assign/route';
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
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Issue Assignment API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/issues/[id]/assign', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock auth to return null (not authenticated)
      (auth as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler: assignHandler,
        paramsPatcher: (params) => {
          params.id = 'test-issue-id';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'PATCH',
            body: JSON.stringify({ assignedToId: 'test-user-id' }),
          });
          expect(res.status).toBe(401);
          const json = await res.json();
          expect(json.error).toContain('Unauthorized');
        },
      });
    });

    it('should return 403 if user is not an admin or account manager', async () => {
      // Mock auth to return a regular user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-id', role: 'DEVELOPER' },
      });

      await testApiHandler({
        appHandler: assignHandler,
        paramsPatcher: (params) => {
          params.id = 'test-issue-id';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'PATCH',
            body: JSON.stringify({ assignedToId: 'test-user-id' }),
          });
          expect(res.status).toBe(403);
          const json = await res.json();
          expect(json.error).toContain('Only Admins and Account Managers can assign issues');
        },
      });
    });

    it('should return 404 if issue does not exist', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin-id', role: 'ADMIN' },
      });

      // Mock prisma to return null for findUnique (issue not found)
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler: assignHandler,
        paramsPatcher: (params) => {
          params.id = 'non-existent-issue-id';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'PATCH',
            body: JSON.stringify({ assignedToId: 'test-user-id' }),
          });
          expect(res.status).toBe(404);
          const json = await res.json();
          expect(json.error).toContain('Issue not found');
        },
      });
    });

    it('should return 400 if assigned user does not exist', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin-id', role: 'ADMIN' },
      });

      // Mock prisma to return an issue
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-issue-id',
        title: 'Test Issue',
      });

      // Mock prisma to return null for user findUnique (user not found)
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        appHandler: assignHandler,
        paramsPatcher: (params) => {
          params.id = 'test-issue-id';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'PATCH',
            body: JSON.stringify({ assignedToId: 'non-existent-user-id' }),
          });
          expect(res.status).toBe(400);
          const json = await res.json();
          expect(json.error).toContain('Validation failed');
        },
      });
    });

    it('should successfully assign an issue to a user (admin)', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin-id', role: 'ADMIN' },
      });

      // Mock prisma to return an issue
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-issue-id',
        title: 'Test Issue',
      });

      // Mock prisma to return a user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        role: 'DEVELOPER',
      });

      // Mock prisma to return the updated issue
      (prisma.issue.update as jest.Mock).mockResolvedValue({
        id: 'test-issue-id',
        title: 'Test Issue',
        assignedToId: 'test-user-id',
        assignedTo: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          role: 'DEVELOPER',
        },
        reportedBy: {
          id: 'reporter-id',
          name: 'Reporter',
          email: 'reporter@example.com',
        },
      });

      await testApiHandler({
        appHandler: assignHandler,
        paramsPatcher: (params) => {
          params.id = 'test-issue-id';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'PATCH',
            body: JSON.stringify({ assignedToId: 'test-user-id' }),
          });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.data.assignedToId).toBe('test-user-id');
          expect(json.message).toContain('Issue assigned successfully');
        },
      });
    });

    it('should successfully assign an issue to a user (account manager)', async () => {
      // Mock auth to return an account manager user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'manager-id', role: 'ACCOUNT_MANAGER' },
      });

      // Mock prisma to return an issue
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-issue-id',
        title: 'Test Issue',
      });

      // Mock prisma to return a user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        role: 'DEVELOPER',
      });

      // Mock prisma to return the updated issue
      (prisma.issue.update as jest.Mock).mockResolvedValue({
        id: 'test-issue-id',
        title: 'Test Issue',
        assignedToId: 'test-user-id',
        assignedTo: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          role: 'DEVELOPER',
        },
        reportedBy: {
          id: 'reporter-id',
          name: 'Reporter',
          email: 'reporter@example.com',
        },
      });

      await testApiHandler({
        appHandler: assignHandler,
        paramsPatcher: (params) => {
          params.id = 'test-issue-id';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'PATCH',
            body: JSON.stringify({ assignedToId: 'test-user-id' }),
          });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.data.assignedToId).toBe('test-user-id');
          expect(json.message).toContain('Issue assigned successfully');
        },
      });
    });

    it('should successfully unassign an issue (set assignedToId to null)', async () => {
      // Mock auth to return an admin user
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'admin-id', role: 'ADMIN' },
      });

      // Mock prisma to return an issue
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-issue-id',
        title: 'Test Issue',
        assignedToId: 'test-user-id',
      });

      // Mock prisma to return the updated issue
      (prisma.issue.update as jest.Mock).mockResolvedValue({
        id: 'test-issue-id',
        title: 'Test Issue',
        assignedToId: null,
        assignedTo: null,
        reportedBy: {
          id: 'reporter-id',
          name: 'Reporter',
          email: 'reporter@example.com',
        },
      });

      await testApiHandler({
        appHandler: assignHandler,
        paramsPatcher: (params) => {
          params.id = 'test-issue-id';
        },
        test: async ({ fetch }) => {
          const res = await fetch({ 
            method: 'PATCH',
            body: JSON.stringify({ assignedToId: null }),
          });
          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.data.assignedToId).toBeNull();
          expect(json.message).toContain('Issue assigned successfully');
        },
      });
    });
  });
}); 