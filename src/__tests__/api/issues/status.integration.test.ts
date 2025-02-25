import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/issues/[id]/status/route";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
// IssueStatus is imported but not directly used in this file
// It might be referenced indirectly through the tests
// import { IssueStatus } from "@/lib/issue-status-utils";
import { Prisma } from "@prisma/client";

// Mock auth to simulate different user roles
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Create a mock request
function createRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

// Integration test that uses the actual database
describe("Issue Status API - Integration", () => {
  // Test data
  let testIssueId: string;
  let testReporterId: string;
  let testAssigneeId: string;
  
  // Setup before tests
  beforeAll(async () => {
    // Create test users
    const reporter = await prisma.user.create({
      data: {
        name: "Test Reporter",
        email: "reporter@test.com",
        role: "USER" as Prisma.UserCreateInput["role"],
      },
    });
    testReporterId = reporter.id;
    
    const assignee = await prisma.user.create({
      data: {
        name: "Test Assignee",
        email: "assignee@test.com",
        role: "DEVELOPER" as Prisma.UserCreateInput["role"],
      },
    });
    testAssigneeId = assignee.id;
    
    // Create a test issue
    const issue = await prisma.issue.create({
      data: {
        title: "Test Issue for Status Updates",
        description: "This is a test issue for status update integration tests",
        status: "NEW",
        priority: "MEDIUM",
        reportedById: testReporterId,
        assignedToId: testAssigneeId,
      },
    });
    testIssueId = issue.id;
  });
  
  // Cleanup after tests
  afterAll(async () => {
    // Delete test data in reverse order of creation
    await prisma.issue.delete({
      where: { id: testIssueId },
    });
    
    await prisma.user.delete({
      where: { id: testAssigneeId },
    });
    
    await prisma.user.delete({
      where: { id: testReporterId },
    });
  });
  
  // Test cases
  it("should allow an admin to update issue status", async () => {
    // Mock admin user
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "admin-id",
        role: "ADMIN" as Prisma.UserCreateInput["role"],
      },
    });
    
    // Update status from NEW to ASSIGNED
    const response = await PATCH(
      createRequest({ status: "ASSIGNED" }),
      { params: { id: testIssueId } }
    );
    
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(200);
    expect(responseData.data.status).toBe("ASSIGNED");
    
    // Verify database was updated
    const updatedIssue = await prisma.issue.findUnique({
      where: { id: testIssueId },
    });
    
    expect(updatedIssue?.status).toBe("ASSIGNED");
  });
  
  it("should allow a developer to update issue status", async () => {
    // Mock developer user (the assignee)
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: testAssigneeId,
        role: "DEVELOPER" as Prisma.UserCreateInput["role"],
      },
    });
    
    // Update status from ASSIGNED to IN_PROGRESS
    const response = await PATCH(
      createRequest({ status: "IN_PROGRESS" }),
      { params: { id: testIssueId } }
    );
    
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(200);
    expect(responseData.data.status).toBe("IN_PROGRESS");
    
    // Verify database was updated
    const updatedIssue = await prisma.issue.findUnique({
      where: { id: testIssueId },
    });
    
    expect(updatedIssue?.status).toBe("IN_PROGRESS");
  });
  
  it("should prevent a regular user from updating issue status", async () => {
    // Mock regular user (the reporter)
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: testReporterId,
        role: "USER" as Prisma.UserCreateInput["role"],
      },
    });
    
    // Attempt to update status
    const response = await PATCH(
      createRequest({ status: "FIXED" }),
      { params: { id: testIssueId } }
    );
    
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(403); // Forbidden
    expect(responseData.error).toContain("permission");
    
    // Verify database was not updated
    const updatedIssue = await prisma.issue.findUnique({
      where: { id: testIssueId },
    });
    
    expect(updatedIssue?.status).toBe("IN_PROGRESS"); // Still the previous status
  });
  
  it("should prevent invalid status transitions", async () => {
    // Mock admin user
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: "admin-id",
        role: "ADMIN" as Prisma.UserCreateInput["role"],
      },
    });
    
    // Attempt an invalid transition (IN_PROGRESS to NEW)
    const response = await PATCH(
      createRequest({ status: "NEW" }),
      { params: { id: testIssueId } }
    );
    
    const responseData = await response.json();
    
    // Assertions
    expect(response.status).toBe(400); // Bad Request
    expect(responseData.error).toContain("Invalid status transition");
    
    // Verify database was not updated
    const updatedIssue = await prisma.issue.findUnique({
      where: { id: testIssueId },
    });
    
    expect(updatedIssue?.status).toBe("IN_PROGRESS"); // Still the previous status
  });
}); 