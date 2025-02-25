import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema for issue update validation
const issueUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
});

// GET /api/issues/[id] - Get a specific issue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const prismaAny = prisma as any;
    const issue = await prismaAny.issue.findUnique({
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
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    
    // Check if user has permission to view this issue
    if (
      session.user.role !== "ADMIN" &&
      issue.reportedById !== session.user.id &&
      issue.assignedToId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error fetching issue:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue" },
      { status: 500 }
    );
  }
}

// PUT /api/issues/[id] - Update a specific issue
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Check if issue exists
    const prismaAny = prisma as any;
    const existingIssue = await prismaAny.issue.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!existingIssue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    
    // Check if user has permission to update this issue
    if (
      session.user.role !== "ADMIN" &&
      existingIssue.reportedById !== session.user.id &&
      existingIssue.assignedToId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validationResult = issueUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Update the issue
    const updatedIssue = await prismaAny.issue.update({
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
    
    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}

// DELETE /api/issues/[id] - Delete a specific issue
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Check if issue exists
    const prismaAny = prisma as any;
    const existingIssue = await prismaAny.issue.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!existingIssue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    
    // Only admins and the reporter can delete an issue
    if (
      session.user.role !== "ADMIN" &&
      existingIssue.reportedById !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Delete the issue
    await prismaAny.issue.delete({
      where: {
        id: params.id,
      },
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json(
      { error: "Failed to delete issue" },
      { status: 500 }
    );
  }
} 