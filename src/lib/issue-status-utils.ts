/**
 * Type for issue statuses
 */
import { IssueStatus } from "@prisma/client";

/**
 * Defines the allowed status transitions for issues
 * The key is the current status, and the value is an array of statuses that it can transition to
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  "NEW": [
    "ASSIGNED",
    "IN_PROGRESS",
    "CLOSED",
    "WONT_FIX",
  ],
  "ASSIGNED": [
    "IN_PROGRESS",
    "PENDING",
    "CLOSED",
    "WONT_FIX",
  ],
  "IN_PROGRESS": [
    "PENDING",
    "NEEDS_REVIEW",
    "FIXED",
    "CLOSED",
    "WONT_FIX",
  ],
  "PENDING": [
    "IN_PROGRESS",
    "NEEDS_REVIEW",
    "FIXED",
    "CLOSED",
    "WONT_FIX",
  ],
  "NEEDS_REVIEW": [
    "IN_PROGRESS",
    "FIXED",
    "CLOSED",
    "WONT_FIX",
  ],
  "FIXED": [
    "NEEDS_REVIEW",
    "CLOSED",
    "IN_PROGRESS", // In case the fix didn't actually work
  ],
  "CLOSED": [
    "IN_PROGRESS", // Can be reopened if needed
  ],
  "WONT_FIX": [
    "IN_PROGRESS", // Can be reopened if requirements change
  ],
};

/**
 * Checks if a status transition is allowed
 * @param currentStatus The current status of the issue
 * @param newStatus The new status to transition to
 * @returns true if the transition is allowed, false otherwise
 */
export function isValidStatusTransition(
  currentStatus: IssueStatus,
  newStatus: IssueStatus
): boolean {
  // If the status isn't changing, it's always valid
  if (currentStatus === newStatus) {
    return true;
  }

  // Check if the new status is in the list of allowed transitions
  return ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Gets a list of allowed next statuses for an issue
 * @param currentStatus The current status of the issue
 * @returns An array of allowed next statuses
 */
export function getAllowedNextStatuses(currentStatus: IssueStatus): IssueStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus];
} 