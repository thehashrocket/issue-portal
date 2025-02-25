import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { isAdmin, isAccountManager, checkAuthorization } from "@/lib/auth-utils";
import { isNotPastDate } from "@/lib/date-utils";
import { z } from "zod";

// Validation schema for due date updates
const dueDateUpdateSchema = z.object({
  dueDate: z.date({
    required_error: "Due date is required",
    invalid_type_error: "Due date must be a valid date",
  }),
});

// PATCH /api/issues/{id}/due-date - Update the due date of an issue
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authentication is handled by middleware
  const session = await auth();
  
  // Get the issue ID from the URL params
  const { id } = params;
  
  try {
    // First, fetch the issue to check if it exists and get its data
    const issue = await prisma.issue.findUnique({
      where: { id },
      select: {
        id: true,
        reportedById: true,
        assignedToId: true,
      },
    });
    
    if (!issue) {
      return ApiErrors.notFound("Issue not found");
    }
    
    // Check authorization for updating the issue
    const authError = checkAuthorization(session, "issue", "update", {
      reportedById: issue.reportedById,
      assignedToId: issue.assignedToId,
    });
    
    if (authError) return authError;
    
    // Only admins and account managers can update due dates
    if (!isAdmin(session) && !isAccountManager(session)) {
      return ApiErrors.forbidden("Only admins and account managers can update due dates");
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = dueDateUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiErrors.validationFailed(validationResult.error.format());
    }
    
    const { dueDate } = validationResult.data;
    
    // Validate that the due date is not in the past
    if (!isNotPastDate(dueDate)) {
      return ApiErrors.badRequest("Due date cannot be in the past");
    }
    
    // Update the issue with the new due date
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: { dueDate },
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
    
    return createSuccessResponse(updatedIssue, 200, "Due date updated successfully");
  } catch (error) {
    console.error("Error updating due date:", error);
    return ApiErrors.serverError("Failed to update due date");
  }
} 