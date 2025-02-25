import prisma from "@/lib/prisma";

// Define the NotificationType enum to match the Prisma schema
enum NotificationType {
  ISSUE_ASSIGNED = "ISSUE_ASSIGNED",
  COMMENT_ADDED = "COMMENT_ADDED",
  STATUS_CHANGED = "STATUS_CHANGED"
}

/**
 * Service for handling notifications
 */
export const NotificationService = {
  /**
   * Create a notification for a user
   */
  createNotification: async (
    type: NotificationType,
    message: string,
    userId: string,
    issueId?: string
  ) => {
    return prisma.notification.create({
      data: {
        type,
        message,
        userId,
        issueId,
      },
    });
  },

  /**
   * Create a notification for issue assignment
   */
  notifyIssueAssigned: async (issueId: string, assignedToId: string, issueTitle: string) => {
    return NotificationService.createNotification(
      NotificationType.ISSUE_ASSIGNED,
      `You have been assigned to issue: ${issueTitle}`,
      assignedToId,
      issueId
    );
  },

  /**
   * Create a notification for a comment added to an issue
   */
  notifyCommentAdded: async (
    issueId: string,
    issueTitle: string,
    commentAuthorName: string,
    userToNotifyId: string
  ) => {
    return NotificationService.createNotification(
      NotificationType.COMMENT_ADDED,
      `${commentAuthorName} commented on issue: ${issueTitle}`,
      userToNotifyId,
      issueId
    );
  },

  /**
   * Create a notification for issue status change
   */
  notifyStatusChanged: async (
    issueId: string,
    issueTitle: string,
    newStatus: string,
    userToNotifyId: string
  ) => {
    return NotificationService.createNotification(
      NotificationType.STATUS_CHANGED,
      `Status changed to ${newStatus} for issue: ${issueTitle}`,
      userToNotifyId,
      issueId
    );
  },

  /**
   * Get notifications for a user
   */
  getUserNotifications: async (userId: string, includeRead: boolean = false) => {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(includeRead ? {} : { read: false }),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        issue: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string, userId: string) => {
    return prisma.notification.updateMany({
      where: {
        id,
        userId, // Ensure the notification belongs to the user
      },
      data: {
        read: true,
      },
    });
  },
}; 