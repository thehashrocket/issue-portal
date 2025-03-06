import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { NotificationService } from "@/lib/notification-service";
import { NotificationType } from "@prisma/client";
import { addDays } from "date-fns";

// This endpoint should be called by a cron job every day
export async function GET() {
  try {
    const tenDaysFromNow = addDays(new Date(), 10);
    const today = new Date();

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

    return NextResponse.json({
      success: true,
      message: `Sent notifications for ${dueIssues.length} due issues`,
    });
  } catch (error) {
    console.error("Error checking due issues:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to check due issues",
    }, { status: 500 });
  }
} 