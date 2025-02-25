import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { issueCreateSchema } from "@/lib/validation";
import { isAdmin, checkAuthorization, isAccountManager } from "@/lib/auth-utils";
import { getDefaultDueDate } from "@/lib/date-utils";

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
    
    // Pagination parameters
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
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
    
    // Get total count for pagination
    const total = await prisma.issue.count({ where });
    
    // Get paginated issues
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
      skip,
      take: limit,
    });
    
    // Add pagination metadata to the response
    const issuesWithMeta = {
      issues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
    
    return createSuccessResponse(issuesWithMeta, 200, "Issues retrieved successfully");
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
    
    // Set default due date if not provided (10 business days from now)
    const dueDate = data.dueDate || getDefaultDueDate();
    
    // Create the issue
    const issue = await prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || "NEW",
        priority: data.priority || "MEDIUM",
        assignedToId: data.assignedToId,
        reportedById: session?.user?.id, // Current user is the reporter
        dueDate: dueDate,
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