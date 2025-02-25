import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/issues/[id]/status/route";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { IssueStatus } from "@/lib/issue-status-utils";
import { isValidStatusTransition } from "@/lib/issue-status-utils";
import { Session } from "next-auth";

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    issue: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock("@/lib/issue-status-utils", () => ({
  isValidStatusTransition: jest.fn(),
}));

// Helper to create a mock request
function createMockRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

// Define a partial session type for testing
type PartialSession = Partial<Session> & {
  user: {
    id: string;
    role: string;
    name?: string;
    email?: string;
  }
};

describe("Issue Status API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PATCH /api/issues/[id]/status", () => {
    const mockIssueId = "test-issue-id";
    const mockParams = { id: mockIssueId };
    
    // Test case: Successfully update issue status
    it("should update issue status when valid request is provided", async () => {
      // Setup mocks
      const mockUser = { id: "user-id", role: "ADMIN" };
      (auth as jest.Mock).mockResolvedValue({ user: mockUser });
      
      const mockExistingIssue = {
        id: mockIssueId,
        status: "IN_PROGRESS" as IssueStatus,
        reportedById: "reporter-id",
        assignedToId: "assignee-id",
      };
      
      const mockUpdatedIssue = {
        ...mockExistingIssue,
        status: "FIXED" as IssueStatus,
        updatedAt: new Date(),
      };
      
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockExistingIssue);
      (prisma.issue.update as jest.Mock).mockResolvedValue(mockUpdatedIssue);
      (isValidStatusTransition as jest.Mock).mockReturnValue(true);
      
      // Execute
      const response = await PATCH(
        createMockRequest({ status: "FIXED" }),
        { params: mockParams }
      );
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.data.status).toBe("FIXED");
      expect(prisma.issue.findUnique).toHaveBeenCalledWith({
        where: { id: mockIssueId },
      });
      expect(isValidStatusTransition).toHaveBeenCalledWith("IN_PROGRESS", "FIXED");
      expect(prisma.issue.update).toHaveBeenCalledWith({
        where: { id: mockIssueId },
        data: {
          status: "FIXED",
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });
    
    // Test case: Issue not found
    it("should return 404 when issue does not exist", async () => {
      // Setup mocks
      (auth as jest.Mock).mockResolvedValue({ user: { id: "user-id", role: "ADMIN" } });
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Execute
      const response = await PATCH(
        createMockRequest({ status: "FIXED" }),
        { params: mockParams }
      );
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.error).toContain("not found");
    });
    
    // Test case: Invalid status transition
    it("should return 400 when status transition is invalid", async () => {
      // Setup mocks
      (auth as jest.Mock).mockResolvedValue({ user: { id: "user-id", role: "ADMIN" } });
      
      const mockExistingIssue = {
        id: mockIssueId,
        status: "CLOSED" as IssueStatus,
        reportedById: "reporter-id",
        assignedToId: "assignee-id",
      };
      
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockExistingIssue);
      (isValidStatusTransition as jest.Mock).mockReturnValue(false);
      
      // Execute
      const response = await PATCH(
        createMockRequest({ status: "NEW" }),
        { params: mockParams }
      );
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.error).toContain("Invalid status transition");
      expect(isValidStatusTransition).toHaveBeenCalledWith("CLOSED", "NEW");
      expect(prisma.issue.update).not.toHaveBeenCalled();
    });
    
    // Test case: Unauthorized user
    it("should return 403 when user is not authorized", async () => {
      // Setup mocks
      (auth as jest.Mock).mockResolvedValue({ user: { id: "user-id", role: "USER" } });
      
      const mockExistingIssue = {
        id: mockIssueId,
        status: "IN_PROGRESS" as IssueStatus,
        reportedById: "reporter-id",
        assignedToId: "assignee-id",
      };
      
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockExistingIssue);
      
      // Execute
      const response = await PATCH(
        createMockRequest({ status: "FIXED" }),
        { params: mockParams }
      );
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(responseData.error).toContain("permission");
    });
    
    // Test case: Invalid request body
    it("should return 400 when request body is invalid", async () => {
      // Setup mocks
      (auth as jest.Mock).mockResolvedValue({ user: { id: "user-id", role: "ADMIN" } });
      
      // Execute
      const response = await PATCH(
        createMockRequest({ status: "INVALID_STATUS" }),
        { params: mockParams }
      );
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.error).toContain("Validation failed");
    });
  });
}); 