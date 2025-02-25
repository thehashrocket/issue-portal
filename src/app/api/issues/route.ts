import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema for issue creation/update validation
const issueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
});

// GET /api/issues - Get all issues
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToId = searchParams.get("assignedToId");
    const reportedById = searchParams.get("reportedById");
    
    // Build filter conditions
    const where: any = {};
    
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
    if (session.user.role !== "ADMIN") {
      where.OR = [
        { reportedById: session.user.id },
        { assignedToId: session.user.id }
      ];
    }
    
    const prismaAny = prisma as any;
    const issues = await prismaAny.issue.findMany({
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
    
    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

// POST /api/issues - Create a new issue
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = issueSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    const prismaAny = prisma as any;
    
    // Create the issue
    const issue = await prismaAny.issue.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || "OPEN",
        priority: data.priority || "MEDIUM",
        assignedToId: data.assignedToId,
        reportedById: session.user.id, // Current user is the reporter
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
    
    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
} 