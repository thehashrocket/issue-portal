import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { issueCreateSchema } from "@/lib/validation";
import { isAdmin, checkAuthorization } from "@/lib/auth-utils";
import { getDefaultDueDate } from "@/lib/date-utils";
import { Prisma } from '@prisma/client';

const issueSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  assignedToId: true,
  reportedById: true,
  createdAt: true,
  updatedAt: true,
  dueDate: true,
  clientId: true,
  rootCauseIdentified: true,
  rootCauseDescription: true,
  workAroundAvailable: true,
  workAroundDescription: true,
  stepsToReproduce: true,
  relatedLogs: true,
  client: {
    select: {
      id: true,
      name: true,
    }
  },
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
} satisfies Prisma.IssueSelect;

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
      select: issueSelect,
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
      return ApiErrors.unprocessableEntity(
        "Validation failed",
        validationResult.error.format()
      );
    }
    
    const data = validationResult.data;
    
    // Set default due date if not provided (10 business days from now)
    const dueDate = data.dueDate || getDefaultDueDate();
    
    // Create the issue
    const issue = await prisma.issue.create({
      data: {
        actualResult: data.actualResult ?? null,
        assignedToId: data.assignedToId ?? null,
        clientId: data.clientId,
        description: data.description,
        dueDate,
        environment: data.environment ?? "LOCAL",
        expectedResult: data.expectedResult ?? null,
        howDisovered: data.howDisovered ?? "OTHER",
        impact: data.impact ?? null,
        priority: data.priority ?? "MEDIUM",
        relatedLogs: data.relatedLogs ?? null,
        reportedById: (session as NonNullable<typeof session>).user.id,
        rootCauseDescription: data.rootCauseDescription ?? null,
        rootCauseIdentified: data.rootCauseIdentified ?? false,
        status: data.status ?? "NEW",
        stepsToReproduce: data.stepsToReproduce ?? null,
        title: data.title,
        workAroundAvailable: data.workAroundAvailable ?? false,
        workAroundDescription: data.workAroundDescription ?? null,
      } satisfies Prisma.IssueUncheckedCreateInput,
      select: issueSelect,
    });
    
    return createSuccessResponse(issue, 201, "Issue created successfully");
  } catch (error) {
    console.error("Error creating issue:", error);
    return ApiErrors.serverError("Failed to create issue");
  }
} 