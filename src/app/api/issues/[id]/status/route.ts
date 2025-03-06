import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isValidStatusTransition } from "@/lib/issue-status-utils";
import { checkAuthorization } from "@/lib/auth-utils";
import { NotificationService } from "@/lib/notification-service";

// Define the schema for status update
const statusUpdateSchema = z.object({
  status: z.enum([
    "NEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "PENDING",
    "NEEDS_REVIEW",
    "FIXED",
    "CLOSED",
    "WONT_FIX",
  ]),
});

// PATCH /api/issues/[id]/status - Update issue status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentication is handled by middleware
  const session = await auth();
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = statusUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiErrors.validationFailed(validationResult.error.format());
    }
    
    const { status: newStatus } = validationResult.data;
    
    // First check if the issue exists
    const { id } = await params;
    const existingIssue = await prisma.issue.findUnique({
      where: {
        id,
      },
      include: {
        assignedTo: true,
        reportedBy: true,
      },
    });
    
    if (!existingIssue) {
      return ApiErrors.notFound("Issue");
    }
    
    // Check authorization - only Developers, Admins, and Account Managers can update status
    const authError = checkAuthorization(session, "issue", "updateStatus", {
      reportedById: existingIssue.reportedById,
      assignedToId: existingIssue.assignedToId
    });
    
    if (authError) return authError;
    
    // // Validate status transition
    // if (!isValidStatusTransition(existingIssue.status, newStatus)) {
    //   return ApiErrors.badRequest(
    //     `Invalid status transition from ${existingIssue.status} to ${newStatus}`
    //   );
    // }
    
    // Use Prisma's update with proper error handling to prevent race conditions
    try {
      const updatedIssue = await prisma.issue.update({
        where: {
          id,
        },
        data: {
          status: newStatus,
          updatedAt: new Date(), // Ensure updatedAt is refreshed
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
      
      // Send notifications to relevant users
      // Notify the assignee if there is one
      if (updatedIssue.assignedToId && session?.user?.id && updatedIssue.assignedToId !== session.user.id) {
        await NotificationService.notifyStatusChanged(
          id,
          updatedIssue.title,
          newStatus,
          updatedIssue.assignedToId
        );
      }
      
      // Notify the reporter if they're not the one who changed the status
      if (updatedIssue.reportedById && session?.user?.id && updatedIssue.reportedById !== session.user.id) {
        await NotificationService.notifyStatusChanged(
          id,
          updatedIssue.title,
          newStatus,
          updatedIssue.reportedById
        );
      }
      
      return createSuccessResponse(updatedIssue, 200, "Issue status updated successfully");
    } catch (updateError) {
      // Handle the case where the issue was deleted between our check and update
      if (updateError instanceof Prisma.PrismaClientKnownRequestError && updateError.code === 'P2025') {
        return ApiErrors.notFound("Issue no longer exists");
      }
      throw updateError; // Re-throw other errors to be caught by the outer catch
    }
  } catch (error) {
    console.error("Error updating issue status:", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return ApiErrors.notFound("Issue");
      }
    }
    
    return ApiErrors.serverError("Failed to update issue status");
  }
} 