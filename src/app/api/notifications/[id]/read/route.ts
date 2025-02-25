import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { Prisma } from "@prisma/client";

// PATCH /api/notifications/[id]/read - Mark a notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authentication is handled by middleware
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    return ApiErrors.unauthorized();
  }
  
  try {
    // First check if the notification exists and belongs to the user
    const notification = await prisma.notification.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!notification) {
      return ApiErrors.notFound("Notification");
    }
    
    // Ensure the notification belongs to the current user
    if (notification.userId !== session.user.id) {
      return ApiErrors.forbidden("You can only mark your own notifications as read");
    }
    
    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: {
        id: params.id,
      },
      data: {
        read: true,
      },
    });
    
    return createSuccessResponse(updatedNotification, 200, "Notification marked as read");
  } catch (error) {
    console.error("Error marking notification as read:", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return ApiErrors.notFound("Notification");
      }
    }
    
    return ApiErrors.serverError("Failed to mark notification as read");
  }
} 