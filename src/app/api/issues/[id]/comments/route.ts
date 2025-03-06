import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";
import { commentCreateSchema } from "@/lib/validation";
import { checkAuthorization } from "@/lib/auth-utils";
import { NotificationService } from "@/lib/notification-service";

// Define a type for the comment with user details
type CommentWithUser = {
  id: string;
  text: string;
  createdById: string;
  issueId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

// GET /api/issues/[id]/comments - Get all comments for an issue
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentication is handled by middleware
  const session = await auth();
  
  try {
    // First check if the issue exists
    const { id } = await params;
    const issue = await prisma.issue.findUnique({
      where: {
        id,
      },
    });
    
    if (!issue) {
      return ApiErrors.notFound("Issue");
    }
    
    // Check authorization for viewing this issue's comments
    const authError = checkAuthorization(session, "issue", "view", {
      reportedById: issue.reportedById,
      assignedToId: issue.assignedToId
    });
    
    if (authError) return authError;
    
    // Fetch all comments for this issue
    const comments = await prisma.$transaction(async (tx) => {
      const result = await tx.$queryRaw`
        SELECT c.*, 
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'image', u.image
          ) as "createdBy"
        FROM "Comment" c
        JOIN "User" u ON c."createdById" = u.id
        WHERE c."issueId" = ${id}
        ORDER BY c."createdAt" DESC
      `;
      return result as CommentWithUser[];
    });
    
    return createSuccessResponse(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return ApiErrors.serverError("Failed to fetch comments");
  }
}

// POST /api/issues/[id]/comments - Create a new comment for an issue
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentication is handled by middleware
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    return ApiErrors.unauthorized();
  }
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = commentCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiErrors.unprocessableEntity(
        "Validation failed",
        validationResult.error.format()
      );
    }
    
    const data = validationResult.data;
    
    // First check if the issue exists
    const { id } = await params;
    const issue = await prisma.issue.findUnique({
      where: {
        id,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!issue) {
      return ApiErrors.notFound("Issue");
    }
    
    // Check authorization for commenting on this issue
    const authError = checkAuthorization(session, "comment", "create");
    
    if (authError) return authError;
    
    // Create the comment using a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate a UUID for the comment
      const commentId = crypto.randomUUID();
      
      // Insert the comment
      await tx.$executeRaw`
        INSERT INTO "Comment" ("id", "text", "createdById", "issueId", "createdAt", "updatedAt")
        VALUES (
          ${commentId}, 
          ${data.text}, 
          ${session.user.id}, 
          ${id}, 
          ${new Date()}, 
          ${new Date()}
        )
      `;
      
      // Fetch the created comment with user details
      const comments = await tx.$queryRaw`
        SELECT c.*, 
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'image', u.image
          ) as "createdBy"
        FROM "Comment" c
        JOIN "User" u ON c."createdById" = u.id
        WHERE c.id = ${commentId}
      `;
      
      // Return the first (and only) comment
      const commentArray = comments as CommentWithUser[];
      return commentArray[0];
    });
    
    // Send notifications to relevant users
    const currentUserName = session.user.name || session.user.email || "A user";
    
    // Notify the assignee if they're not the one who commented
    if (issue.assignedToId && issue.assignedToId !== session.user.id) {
      await NotificationService.notifyCommentAdded(
        id,
        issue.title,
        currentUserName,
        issue.assignedToId
      );
    }
    
    // Notify the reporter if they're not the one who commented
    if (issue.reportedById !== session.user.id) {
      await NotificationService.notifyCommentAdded(
        id,
        issue.title,
        currentUserName,
        issue.reportedById
      );
    }
    
    return createSuccessResponse(result, 201, "Comment created successfully");
  } catch (error) {
    console.error("Error creating comment:", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return ApiErrors.notFound("Issue");
      }
    }
    
    return ApiErrors.serverError("Failed to create comment");
  }
} 