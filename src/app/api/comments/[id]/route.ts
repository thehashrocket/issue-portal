import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { Prisma, Comment } from "@prisma/client";
import { checkAuthorization } from "@/lib/auth-utils";

// DELETE /api/comments/[id] - Delete a specific comment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentication is handled by middleware
  const session = await auth();
  
  if (!session || !session.user) {
    return ApiErrors.unauthorized();
  }
  
  try {
    const { id } = await params;
    // First check if the comment exists
    const comments = await prisma.$queryRaw`
      SELECT * FROM "Comment" WHERE id = ${id}
    `;
    
    // Convert the result to an array and get the first item
    const commentArray = comments as Comment[];
    if (!commentArray.length) {
      return ApiErrors.notFound("Comment");
    }
    
    const comment = commentArray[0];
    
    // Check authorization for deleting this comment
    const authError = checkAuthorization(session, "comment", "delete", {
      createdById: comment.createdById
    });
    
    if (authError) return authError;
    
    // Use a transaction to delete the comment
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM "Comment" WHERE id = ${id}
      `;
    });
    
    return createSuccessResponse({ id }, 200, "Comment deleted successfully");
  } catch (error) {
    console.error("Error deleting comment:", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return ApiErrors.notFound("Comment");
      }
    }
    
    return ApiErrors.serverError("Failed to delete comment");
  }
} 