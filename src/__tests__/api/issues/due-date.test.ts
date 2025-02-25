import { NextRequest } from "next/server";
import { createMocks } from "node-mocks-http";
import { PATCH } from "@/app/api/issues/[id]/due-date/route";
import { POST } from "@/app/api/issues/route";
import { PUT } from "@/app/api/issues/[id]/route";
import prisma from "@/lib/prisma";
import { addBusinessDays, getDefaultDueDate } from "@/lib/date-utils";

// Mock the auth module
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock the prisma client
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    issue: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Import the mocked auth module
import { auth } from "@/lib/auth";

describe("Issue Due Date API", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("POST /api/issues", () => {
    it("should set default due date (10 business days) when creating a new issue", async () => {
      // Mock the auth session
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user-id", role: "USER" },
      });

      // Mock the issue creation
      const mockIssue = {
        id: "issue-id",
        title: "Test Issue",
        description: "Test Description",
        status: "NEW",
        priority: "MEDIUM",
        reportedById: "user-id",
        dueDate: getDefaultDueDate(),
      };
      (prisma.issue.create as jest.Mock).mockResolvedValue(mockIssue);

      // Create a mock request
      const { req } = createMocks({
        method: "POST",
        body: {
          title: "Test Issue",
          description: "Test Description",
        },
      });

      // Call the handler
      const response = await POST(req as unknown as NextRequest);
      const responseData = await response.json();

      // Verify the response
      expect(response.status).toBe(201);
      expect(responseData.data).toEqual(mockIssue);

      // Verify that prisma.issue.create was called with the correct arguments
      expect(prisma.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Test Issue",
            description: "Test Description",
            dueDate: expect.any(Date),
          }),
        })
      );
    });

    it("should use provided due date when creating a new issue", async () => {
      // Mock the auth session
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user-id", role: "USER" },
      });

      // Create a custom due date
      const customDueDate = new Date();
      customDueDate.setDate(customDueDate.getDate() + 30); // 30 days in the future

      // Mock the issue creation
      const mockIssue = {
        id: "issue-id",
        title: "Test Issue",
        description: "Test Description",
        status: "NEW",
        priority: "MEDIUM",
        reportedById: "user-id",
        dueDate: customDueDate,
      };
      (prisma.issue.create as jest.Mock).mockResolvedValue(mockIssue);

      // Create a mock request
      const { req } = createMocks({
        method: "POST",
        body: {
          title: "Test Issue",
          description: "Test Description",
          dueDate: customDueDate,
        },
      });

      // Call the handler
      const response = await POST(req as unknown as NextRequest);
      const responseData = await response.json();

      // Verify the response
      expect(response.status).toBe(201);
      expect(responseData.data).toEqual(mockIssue);

      // Verify that prisma.issue.create was called with the correct arguments
      expect(prisma.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Test Issue",
            description: "Test Description",
            dueDate: customDueDate,
          }),
        })
      );
    });
  });

  describe("PATCH /api/issues/[id]/due-date", () => {
    it("should allow admins to update due date", async () => {
      // Mock the auth session
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "admin-id", role: "ADMIN" },
      });

      // Mock the issue retrieval
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: "issue-id",
        reportedById: "user-id",
        assignedToId: "developer-id",
      });

      // Create a new due date
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 15); // 15 days in the future

      // Mock the issue update
      const mockUpdatedIssue = {
        id: "issue-id",
        title: "Test Issue",
        dueDate: newDueDate,
      };
      (prisma.issue.update as jest.Mock).mockResolvedValue(mockUpdatedIssue);

      // Create a mock request
      const { req } = createMocks({
        method: "PATCH",
        body: {
          dueDate: newDueDate,
        },
      });

      // Call the handler
      const response = await PATCH(req as unknown as NextRequest, {
        params: { id: "issue-id" },
      });
      const responseData = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(mockUpdatedIssue);

      // Verify that prisma.issue.update was called with the correct arguments
      expect(prisma.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "issue-id" },
          data: { dueDate: newDueDate },
        })
      );
    });

    it("should allow account managers to update due date", async () => {
      // Mock the auth session
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "manager-id", role: "ACCOUNT_MANAGER" },
      });

      // Mock the issue retrieval
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: "issue-id",
        reportedById: "user-id",
        assignedToId: "developer-id",
      });

      // Create a new due date
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 15); // 15 days in the future

      // Mock the issue update
      const mockUpdatedIssue = {
        id: "issue-id",
        title: "Test Issue",
        dueDate: newDueDate,
      };
      (prisma.issue.update as jest.Mock).mockResolvedValue(mockUpdatedIssue);

      // Create a mock request
      const { req } = createMocks({
        method: "PATCH",
        body: {
          dueDate: newDueDate,
        },
      });

      // Call the handler
      const response = await PATCH(req as unknown as NextRequest, {
        params: { id: "issue-id" },
      });
      const responseData = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(mockUpdatedIssue);
    });

    it("should not allow developers to update due date", async () => {
      // Mock the auth session
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "developer-id", role: "DEVELOPER" },
      });

      // Mock the issue retrieval
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: "issue-id",
        reportedById: "user-id",
        assignedToId: "developer-id",
      });

      // Create a new due date
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 15); // 15 days in the future

      // Create a mock request
      const { req } = createMocks({
        method: "PATCH",
        body: {
          dueDate: newDueDate,
        },
      });

      // Call the handler
      const response = await PATCH(req as unknown as NextRequest, {
        params: { id: "issue-id" },
      });

      // Verify the response
      expect(response.status).toBe(403); // Forbidden
    });

    it("should reject past dates", async () => {
      // Mock the auth session
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "admin-id", role: "ADMIN" },
      });

      // Mock the issue retrieval
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: "issue-id",
        reportedById: "user-id",
        assignedToId: "developer-id",
      });

      // Create a past due date
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 5); // 5 days in the past

      // Create a mock request
      const { req } = createMocks({
        method: "PATCH",
        body: {
          dueDate: pastDueDate,
        },
      });

      // Call the handler
      const response = await PATCH(req as unknown as NextRequest, {
        params: { id: "issue-id" },
      });

      // Verify the response
      expect(response.status).toBe(400); // Bad Request
    });
  });

  describe("PUT /api/issues/[id]", () => {
    it("should prevent developers from updating due date", async () => {
      // Mock the auth session
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "developer-id", role: "DEVELOPER" },
      });

      // Mock the issue retrieval
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: "issue-id",
        reportedById: "user-id",
        assignedToId: "developer-id",
      });

      // Create a new due date
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 15); // 15 days in the future

      // Create a mock request
      const { req } = createMocks({
        method: "PUT",
        body: {
          title: "Updated Title",
          dueDate: newDueDate,
        },
      });

      // Call the handler
      const response = await PUT(req as unknown as NextRequest, {
        params: { id: "issue-id" },
      });

      // Verify the response
      expect(response.status).toBe(403); // Forbidden
    });

    it("should allow developers to update other fields but not due date", async () => {
      // Mock the auth session
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "developer-id", role: "DEVELOPER" },
      });

      // Mock the issue retrieval
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: "issue-id",
        reportedById: "user-id",
        assignedToId: "developer-id",
      });

      // Mock the issue update
      const mockUpdatedIssue = {
        id: "issue-id",
        title: "Updated Title",
        description: "Updated Description",
      };
      (prisma.issue.update as jest.Mock).mockResolvedValue(mockUpdatedIssue);

      // Create a mock request
      const { req } = createMocks({
        method: "PUT",
        body: {
          title: "Updated Title",
          description: "Updated Description",
        },
      });

      // Call the handler
      const response = await PUT(req as unknown as NextRequest, {
        params: { id: "issue-id" },
      });
      const responseData = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(mockUpdatedIssue);

      // Verify that prisma.issue.update was called with the correct arguments
      expect(prisma.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "issue-id" },
          data: {
            title: "Updated Title",
            description: "Updated Description",
          },
        })
      );
    });

    it("should allow admins to update due date", async () => {
      // Mock the auth session
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "admin-id", role: "ADMIN" },
      });

      // Mock the issue retrieval
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: "issue-id",
        reportedById: "user-id",
        assignedToId: "developer-id",
      });

      // Create a new due date
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 15); // 15 days in the future

      // Mock the issue update
      const mockUpdatedIssue = {
        id: "issue-id",
        title: "Updated Title",
        dueDate: newDueDate,
      };
      (prisma.issue.update as jest.Mock).mockResolvedValue(mockUpdatedIssue);

      // Create a mock request
      const { req } = createMocks({
        method: "PUT",
        body: {
          title: "Updated Title",
          dueDate: newDueDate,
        },
      });

      // Call the handler
      const response = await PUT(req as unknown as NextRequest, {
        params: { id: "issue-id" },
      });
      const responseData = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(mockUpdatedIssue);

      // Verify that prisma.issue.update was called with the correct arguments
      expect(prisma.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "issue-id" },
          data: {
            title: "Updated Title",
            dueDate: newDueDate,
          },
        })
      );
    });

    it("should reject past dates for due date updates", async () => {
      // Mock the auth session
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "admin-id", role: "ADMIN" },
      });

      // Mock the issue retrieval
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({
        id: "issue-id",
        reportedById: "user-id",
        assignedToId: "developer-id",
      });

      // Create a past due date
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 5); // 5 days in the past

      // Create a mock request
      const { req } = createMocks({
        method: "PUT",
        body: {
          title: "Updated Title",
          dueDate: pastDueDate,
        },
      });

      // Call the handler
      const response = await PUT(req as unknown as NextRequest, {
        params: { id: "issue-id" },
      });

      // Verify the response
      expect(response.status).toBe(400); // Bad Request
    });
  });

  describe("Date utility functions", () => {
    it("should calculate business days correctly", () => {
      // Test with a known date (e.g., Monday)
      const monday = new Date("2023-01-02"); // A Monday
      
      // Adding 5 business days should result in the next Monday
      const nextMonday = addBusinessDays(5, monday);
      expect(nextMonday.getDay()).toBe(1); // Monday is day 1
      expect(nextMonday.getDate()).toBe(9); // Should be January 9th
      
      // Adding 10 business days should result in two weeks later (Monday)
      const twoWeeksLater = addBusinessDays(10, monday);
      expect(twoWeeksLater.getDay()).toBe(1); // Monday is day 1
      expect(twoWeeksLater.getDate()).toBe(16); // Should be January 16th
    });
    
    it("should handle weekend skipping correctly", () => {
      // Test with a Friday
      const friday = new Date("2023-01-06"); // A Friday
      
      // Adding 1 business day should result in the next Monday
      const nextMonday = addBusinessDays(1, friday);
      expect(nextMonday.getDay()).toBe(1); // Monday is day 1
      expect(nextMonday.getDate()).toBe(9); // Should be January 9th
    });
  });
}); 