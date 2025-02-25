import { NextRequest } from "next/server";
import { createMocks } from "node-mocks-http";
import { GET } from "@/app/api/notifications/route";
import { PATCH } from "@/app/api/notifications/[id]/read/route";
import prisma from "@/lib/prisma";
import { NotificationService } from "@/lib/notification-service";

// Mock the auth module
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(() => ({
    user: {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      role: "USER",
    },
  })),
}));

// Mock Prisma
jest.mock("@/lib/prisma", () => {
  // Define the mock type to avoid circular reference
  type MockPrisma = {
    notification: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  
  const mockPrisma: MockPrisma = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return mockPrisma;
});

describe("Notification API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/notifications", () => {
    it("should return user's notifications", async () => {
      // Mock data
      const mockNotifications = [
        {
          id: "notification-1",
          type: "ISSUE_ASSIGNED",
          message: "You have been assigned to issue: Test Issue",
          read: false,
          userId: "test-user-id",
          issueId: "issue-1",
          createdAt: new Date(),
          issue: {
            id: "issue-1",
            title: "Test Issue",
          },
        },
      ];

      // Mock Prisma response
      prisma.notification.count.mockResolvedValue(1);
      prisma.notification.findMany.mockResolvedValue(mockNotifications);

      // Create mock request
      const { req } = createMocks({
        method: "GET",
        url: "/api/notifications",
      });

      // Call the handler
      const response = await GET(req as unknown as NextRequest);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.data.notifications).toEqual(mockNotifications);
      expect(responseData.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "test-user-id",
          },
        })
      );
    });

    it("should filter unread notifications", async () => {
      // Create mock request with unreadOnly=true
      const { req } = createMocks({
        method: "GET",
        url: "/api/notifications?unreadOnly=true",
      });

      // Mock Prisma response
      prisma.notification.count.mockResolvedValue(0);
      prisma.notification.findMany.mockResolvedValue([]);

      // Call the handler
      await GET(req as unknown as NextRequest);

      // Assertions
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "test-user-id",
            read: false,
          },
        })
      );
    });
  });

  describe("PATCH /api/notifications/[id]/read", () => {
    it("should mark a notification as read", async () => {
      // Mock data
      const mockNotification = {
        id: "notification-1",
        type: "ISSUE_ASSIGNED",
        message: "You have been assigned to issue: Test Issue",
        read: false,
        userId: "test-user-id",
        issueId: "issue-1",
        createdAt: new Date(),
      };

      // Mock Prisma response
      prisma.notification.findUnique.mockResolvedValue(mockNotification);
      prisma.notification.update.mockResolvedValue({
        ...mockNotification,
        read: true,
      });

      // Create mock request
      const { req } = createMocks({
        method: "PATCH",
        url: "/api/notifications/notification-1/read",
      });

      // Call the handler
      const response = await PATCH(req as unknown as NextRequest, {
        params: { id: "notification-1" },
      });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.data.read).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: {
          id: "notification-1",
        },
        data: {
          read: true,
        },
      });
    });

    it("should return 404 if notification does not exist", async () => {
      // Mock Prisma response
      prisma.notification.findUnique.mockResolvedValue(null);

      // Create mock request
      const { req } = createMocks({
        method: "PATCH",
        url: "/api/notifications/non-existent-id/read",
      });

      // Call the handler
      const response = await PATCH(req as unknown as NextRequest, {
        params: { id: "non-existent-id" },
      });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.error).toBe("Notification not found");
    });

    it("should return 403 if notification belongs to another user", async () => {
      // Mock data
      const mockNotification = {
        id: "notification-1",
        type: "ISSUE_ASSIGNED",
        message: "You have been assigned to issue: Test Issue",
        read: false,
        userId: "another-user-id", // Different user
        issueId: "issue-1",
        createdAt: new Date(),
      };

      // Mock Prisma response
      prisma.notification.findUnique.mockResolvedValue(mockNotification);

      // Create mock request
      const { req } = createMocks({
        method: "PATCH",
        url: "/api/notifications/notification-1/read",
      });

      // Call the handler
      const response = await PATCH(req as unknown as NextRequest, {
        params: { id: "notification-1" },
      });
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(responseData.error).toBe("You can only mark your own notifications as read");
    });
  });

  describe("NotificationService", () => {
    it("should create a notification for issue assignment", async () => {
      // Mock Prisma response
      prisma.notification.create.mockResolvedValue({
        id: "new-notification",
        type: "ISSUE_ASSIGNED",
        message: "You have been assigned to issue: Test Issue",
        read: false,
        userId: "user-id",
        issueId: "issue-id",
        createdAt: new Date(),
      });

      // Call the service
      await NotificationService.notifyIssueAssigned(
        "issue-id",
        "user-id",
        "Test Issue"
      );

      // Assertions
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          type: "ISSUE_ASSIGNED",
          message: "You have been assigned to issue: Test Issue",
          userId: "user-id",
          issueId: "issue-id",
        },
      });
    });

    it("should create a notification for comment added", async () => {
      // Mock Prisma response
      prisma.notification.create.mockResolvedValue({
        id: "new-notification",
        type: "COMMENT_ADDED",
        message: "Test User commented on issue: Test Issue",
        read: false,
        userId: "user-id",
        issueId: "issue-id",
        createdAt: new Date(),
      });

      // Call the service
      await NotificationService.notifyCommentAdded(
        "issue-id",
        "Test Issue",
        "Test User",
        "user-id"
      );

      // Assertions
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          type: "COMMENT_ADDED",
          message: "Test User commented on issue: Test Issue",
          userId: "user-id",
          issueId: "issue-id",
        },
      });
    });

    it("should create a notification for status change", async () => {
      // Mock Prisma response
      prisma.notification.create.mockResolvedValue({
        id: "new-notification",
        type: "STATUS_CHANGED",
        message: "Status changed to IN_PROGRESS for issue: Test Issue",
        read: false,
        userId: "user-id",
        issueId: "issue-id",
        createdAt: new Date(),
      });

      // Call the service
      await NotificationService.notifyStatusChanged(
        "issue-id",
        "Test Issue",
        "IN_PROGRESS",
        "user-id"
      );

      // Assertions
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          type: "STATUS_CHANGED",
          message: "Status changed to IN_PROGRESS for issue: Test Issue",
          userId: "user-id",
          issueId: "issue-id",
        },
      });
    });
  });
}); 