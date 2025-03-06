import prisma from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

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
   * Create a notification for an issue that is due soon
   */
  notifyIssueDueSoon: async (
    issueId: string,
    issueTitle: string,
    dueDate: Date,
    userToNotifyId: string
  ) => {
    const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return NotificationService.createNotification(
      NotificationType.ISSUE_DUE_SOON,
      `Issue due in ${daysUntilDue} days: ${issueTitle}`,
      userToNotifyId,
      issueId
    );
  },

  /**
   * Get notifications for a user
   */
  getUserNotifications: async (userId: string, includeRead: boolean = false) => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return prisma.notification.findMany({
      where: {
        userId,
        OR: [
          { read: false },
          {
            read: true,
            readAt: {
              lt: oneDayAgo
            }
          }
        ]
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
    const now = new Date();
    return prisma.notification.updateMany({
      where: {
        id,
        userId, // Ensure the notification belongs to the user
      },
      data: {
        read: true,
        readAt: now,
      },
    });
  },

  /**
   * Mark all notifications as read for a user with a specific timestamp
   */
  markAllAsRead: async (userId: string) => {
    const now = new Date();
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: now,
      },
    });
  },
}; 