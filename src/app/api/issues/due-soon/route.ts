import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { addDays } from "date-fns";
import { NotificationService } from "@/lib/notification-service";
import { NotificationType } from "@prisma/client";

// Function to send notifications for issues due soon
async function sendDueSoonNotifications() {
  const tenDaysFromNow = addDays(new Date(), 10);
  const today = new Date();

  try {
    // Find all issues that are:
    // 1. Due within the next 10 days
    // 2. Not already notified today
    // 3. Have an active status
    const dueIssues = await prisma.issue.findMany({
      where: {
        status: {
          in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'NEEDS_REVIEW'],
        },
        dueDate: {
          not: null,
          lte: tenDaysFromNow,
          gt: today,
        },
        notifications: {
          none: {
            type: NotificationType.ISSUE_DUE_SOON,
            createdAt: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            },
          },
        },
      },
      include: {
        assignedTo: true,
        reportedBy: true,
      },
    });

    // Send notifications for each due issue
    for (const issue of dueIssues) {
      if (issue.dueDate) {
        // Notify assigned user if exists
        if (issue.assignedTo) {
          await NotificationService.notifyIssueDueSoon(
            issue.id,
            issue.title,
            issue.dueDate,
            issue.assignedTo.id
          );
        }

        // Notify reporter
        await NotificationService.notifyIssueDueSoon(
          issue.id,
          issue.title,
          issue.dueDate,
          issue.reportedBy.id
        );
      }
    }

    return dueIssues;
  } catch (error) {
    console.error("Error sending due soon notifications:", error);
    throw error;
  }
}

export async function GET() {
  // Authentication is handled by middleware
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    return ApiErrors.unauthorized();
  }
  
  try {
    const tenDaysFromNow = addDays(new Date(), 10);
    
    // First, send notifications for due issues
    await sendDueSoonNotifications();
    
    // Then return issues due soon for the current user
    const dueIssues = await prisma.issue.findMany({
      where: {
        status: {
          in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'NEEDS_REVIEW'],
        },
        dueDate: {
          not: null,
          lte: tenDaysFromNow,
          gt: new Date(),
        },
        OR: [
          { assignedToId: session.user.id },
          { reportedById: session.user.id },
        ],
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          dueDate: 'asc',
        },
      ],
    });
    
    return createSuccessResponse(dueIssues, 200, "Due issues retrieved successfully");
  } catch (error) {
    console.error("Error fetching due issues:", error);
    return ApiErrors.serverError("Failed to fetch due issues");
  }
} 