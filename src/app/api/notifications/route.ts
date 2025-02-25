import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { checkAuthorization } from "@/lib/auth-utils";

// GET /api/notifications - Get all notifications for the current user
export async function GET(request: NextRequest) {
  // Authentication is handled by middleware
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    return ApiErrors.unauthorized();
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    
    // Pagination parameters
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {
      userId: session.user.id,
    };
    
    if (unreadOnly) {
      where.read = false;
    }
    
    // Get total count for pagination
    const total = await prisma.notification.count({ where });
    
    // Get paginated notifications
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        issue: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    // Add pagination metadata to the response
    const notificationsWithMeta = {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
    
    return createSuccessResponse(notificationsWithMeta, 200, "Notifications retrieved successfully");
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return ApiErrors.serverError("Failed to fetch notifications");
  }
} 