import { auth } from "@/lib/auth";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { NotificationService } from "@/lib/notification-service";

// POST /api/notifications/mark-all-read - Mark all notifications as read for the current user
export async function POST() {
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    return ApiErrors.unauthorized();
  }
  
  try {
    await NotificationService.markAllAsRead(session.user.id);
    return createSuccessResponse(null, 200, "All notifications marked as read");
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return ApiErrors.serverError("Failed to mark all notifications as read");
  }
} 