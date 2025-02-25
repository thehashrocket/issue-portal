import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { issueCreateSchema } from "@/lib/validation";
import { isAdmin, checkAuthorization } from "@/lib/auth-utils";

// GET /api/issues - Get all issues
export async function GET(request: NextRequest) {
  // Authentication is now handled by middleware
  // We can assume session and session.user exist
  const session = await auth();
  
  // Check authorization for listing issues
  const authError = checkAuthorization(session, "issue", "list");
  if (authError) return authError;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToId = searchParams.get("assignedToId");
    const reportedById = searchParams.get("reportedById");
    
    // Build filter conditions
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }
    
    if (reportedById) {
      where.reportedById = reportedById;
    }
    
    // If user is not an admin, only show issues they reported or are assigned to
    if (!isAdmin(session)) {
      where.OR = [
        { reportedById: session?.user?.id },
        { assignedToId: session?.user?.id }
      ];
    }
    
    const issues = await prisma.issue.findMany({
      where,
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
      orderBy: {
        updatedAt: "desc",
      },
    });
    
    return createSuccessResponse(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return ApiErrors.serverError("Failed to fetch issues");
  }
}

// POST /api/issues - Create a new issue
export async function POST(request: NextRequest) {
  // Authentication is now handled by middleware
  // We can assume session and session.user exist
  const session = await auth();
  
  // Check authorization for creating issues
  const authError = checkAuthorization(session, "issue", "create");
  if (authError) return authError;
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = issueCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiErrors.validationFailed(validationResult.error.format());
    }
    
    const data = validationResult.data;
    
    // Create the issue
    const issue = await prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || "OPEN",
        priority: data.priority || "MEDIUM",
        assignedToId: data.assignedToId,
        reportedById: session?.user?.id, // Current user is the reporter
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
    
    return createSuccessResponse(issue, 201, "Issue created successfully");
  } catch (error) {
    console.error("Error creating issue:", error);
    return ApiErrors.serverError("Failed to create issue");
  }
} 