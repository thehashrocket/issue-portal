import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";
import { issueUpdateSchema } from "@/lib/validation";
import { checkAuthorization } from "@/lib/auth-utils";

// GET /api/issues/[id] - Get a specific issue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authentication is now handled by middleware
  // We can assume session and session.user exist
  const session = await auth();
  
  try {
    const issue = await prisma.issue.findUnique({
      where: {
        id: params.id,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!issue) {
      return ApiErrors.notFound("Issue");
    }
    
    // Check authorization for viewing this issue
    const authError = checkAuthorization(session, "issue", "view", {
      reportedById: issue.reportedById,
      assignedToId: issue.assignedToId
    });
    
    if (authError) return authError;
    
    return createSuccessResponse(issue);
  } catch (error) {
    console.error("Error fetching issue:", error);
    return ApiErrors.serverError("Failed to fetch issue");
  }
}

// PUT /api/issues/[id] - Update a specific issue
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authentication is now handled by middleware
  // We can assume session and session.user exist
  const session = await auth();
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = issueUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiErrors.validationFailed(validationResult.error.format());
    }
    
    const data = validationResult.data;
    
    // First check if the issue exists
    const existingIssue = await prisma.issue.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!existingIssue) {
      return ApiErrors.notFound("Issue");
    }
    
    // Check authorization for updating this issue
    const authError = checkAuthorization(session, "issue", "update", {
      reportedById: existingIssue.reportedById,
      assignedToId: existingIssue.assignedToId
    });
    
    if (authError) return authError;
    
    // Use Prisma's update with proper error handling to prevent race conditions
    try {
      const updatedIssue = await prisma.issue.update({
        where: {
          id: params.id,
        },
        data,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reportedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      
      return createSuccessResponse(updatedIssue, 200, "Issue updated successfully");
    } catch (updateError) {
      // Handle the case where the issue was deleted between our check and update
      if (updateError instanceof Prisma.PrismaClientKnownRequestError && updateError.code === 'P2025') {
        return ApiErrors.notFound("Issue no longer exists");
      }
      throw updateError; // Re-throw other errors to be caught by the outer catch
    }
  } catch (error) {
    console.error("Error updating issue:", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return ApiErrors.notFound("Issue");
      }
    }
    
    return ApiErrors.serverError("Failed to update issue");
  }
}

// DELETE /api/issues/[id] - Delete a specific issue
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authentication is now handled by middleware
  // We can assume session and session.user exist
  const session = await auth();
  
  try {
    // First check if the issue exists
    const existingIssue = await prisma.issue.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!existingIssue) {
      return ApiErrors.notFound("Issue");
    }
    
    // Check authorization for deleting this issue
    const authError = checkAuthorization(session, "issue", "delete", {
      reportedById: existingIssue.reportedById
    });
    
    if (authError) return authError;
    
    // Use Prisma's delete with proper error handling to prevent race conditions
    try {
      await prisma.issue.delete({
        where: {
          id: params.id,
        },
      });
      
      return createSuccessResponse({ id: params.id }, 200, "Issue deleted successfully");
    } catch (deleteError) {
      // Handle the case where the issue was deleted between our check and delete
      if (deleteError instanceof Prisma.PrismaClientKnownRequestError && deleteError.code === 'P2025') {
        return ApiErrors.notFound("Issue no longer exists");
      }
      throw deleteError; // Re-throw other errors to be caught by the outer catch
    }
  } catch (error) {
    console.error("Error deleting issue:", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return ApiErrors.notFound("Issue");
      }
    }
    
    return ApiErrors.serverError("Failed to delete issue");
  }
} 