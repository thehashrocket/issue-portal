import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { Prisma } from '@prisma/client';
// checkAuthorization is defined but never used
// import { checkAuthorization } from "@/lib/auth-utils";

// GET /api/notifications - Get all notifications for the current user
export async function GET(request: NextRequest) {
  // Authentication is handled by middleware
  const session = await auth();
  
  console.log('Session in notifications API:', session);
  
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
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const where: Prisma.NotificationWhereInput = {
      userId: session.user.id,
      OR: [
        { read: false },
        {
          read: true,
          readAt: {
            lt: oneDayAgo
          }
        }
      ]
    };
    
    console.log('Notification query where clause:', where);
    
    // Get total count for pagination
    const total = await prisma.notification.count({ where });
    
    console.log('Total notifications found:', total);
    
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
    
    console.log('Found notifications:', notifications);
    
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