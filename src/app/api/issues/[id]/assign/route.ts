import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isAdmin, isAccountManager } from "@/lib/auth-utils";

// Validation schema for issue assignment
const assignIssueSchema = z.object({
  assignedToId: z.string().uuid().nullable().optional(),
});

// PATCH /api/issues/[id]/assign - Assign an issue to a developer
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authentication is handled by middleware
  const session = await auth();
  
  // Only Admins and Account Managers can assign issues
  if (!isAdmin(session) && !isAccountManager(session)) {
    return ApiErrors.forbidden("Only Admins and Account Managers can assign issues");
  }
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = assignIssueSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiErrors.validationFailed(validationResult.error.format());
    }
    
    const { assignedToId } = validationResult.data;
    
    // First check if the issue exists
    const existingIssue = await prisma.issue.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!existingIssue) {
      return ApiErrors.notFound("Issue");
    }
    
    // If assignedToId is provided, verify that the user exists and is a developer
    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: {
          id: assignedToId,
        },
        select: {
          id: true,
          role: true,
        },
      });
      
      if (!assignedUser) {
        return ApiErrors.validationFailed("Assigned user does not exist");
      }
      
      // Optionally, you can restrict assignment to only developers
      // Uncomment the following code if you want to enforce this restriction
      /*
      if (assignedUser.role !== "DEVELOPER") {
        return ApiErrors.validationFailed("Issues can only be assigned to developers");
      }
      */
    }
    
    // Use Prisma's update with proper error handling
    try {
      const updatedIssue = await prisma.issue.update({
        where: {
          id: params.id,
        },
        data: {
          assignedToId,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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
      
      return createSuccessResponse(updatedIssue, 200, "Issue assigned successfully");
    } catch (updateError) {
      // Handle the case where the issue was deleted between our check and update
      if (updateError instanceof Prisma.PrismaClientKnownRequestError && updateError.code === 'P2025') {
        return ApiErrors.notFound("Issue no longer exists");
      }
      throw updateError; // Re-throw other errors to be caught by the outer catch
    }
  } catch (error) {
    console.error("Error assigning issue:", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return ApiErrors.notFound("Issue");
      }
    }
    
    return ApiErrors.serverError("Failed to assign issue");
  }
} 