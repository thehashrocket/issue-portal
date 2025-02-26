import { z } from "zod";

/**
 * Shared validation schemas for the application
 */

// ==================== ISSUE SCHEMAS ====================

// Base schema with common fields for both creation and updates
export const issueBaseSchema = {
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: z.enum(["NEW", "ASSIGNED", "IN_PROGRESS", "PENDING", "NEEDS_REVIEW", "FIXED", "CLOSED", "WONT_FIX"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  assignedToId: z.string().uuid().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  clientId: z.string().uuid(),
};

// Schema for issue creation - all fields are required except those marked optional
export const issueCreateSchema = z.object({
  ...issueBaseSchema,
  // Override status and priority to make them optional with defaults
  status: issueBaseSchema.status.optional(),
  priority: issueBaseSchema.priority.optional(),
});

// Schema for issue updates - all fields are optional
export const issueUpdateSchema = z.object({
  ...Object.entries(issueBaseSchema).reduce((acc, [key, validator]) => {
    // Make all fields optional
    acc[key] = validator.optional();
    return acc;
  }, {} as Record<string, z.ZodTypeAny>),
});

// Types derived from the issue schemas
export type IssueCreateInput = z.infer<typeof issueCreateSchema>;
export type IssueUpdateInput = z.infer<typeof issueUpdateSchema>;

// ==================== CLIENT SCHEMAS ====================

// Base schema with common fields for both creation and updates
export const clientBaseSchema = {
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  primaryContact: z.string().optional().nullable(),
  sla: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "LEAD", "FORMER"]).optional(),
  managerId: z.string().uuid().optional().nullable(),
};

// Schema for client creation
export const clientCreateSchema = z.object({
  ...clientBaseSchema,
});

// Schema for client updates - all fields are optional
export const clientUpdateSchema = z.object({
  ...Object.entries(clientBaseSchema).reduce((acc, [key, validator]) => {
    // Make all fields optional
    acc[key] = validator.optional();
    return acc;
  }, {} as Record<string, z.ZodTypeAny>),
});

// Types derived from the client schemas
export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;

// ==================== USER SCHEMAS ====================

// Base schema with common fields for both creation and updates
export const userBaseSchema = {
  name: z.string().optional().nullable(),
  email: z.string().email("Invalid email address"),
  role: z.enum(["USER", "ADMIN", "ACCOUNT_MANAGER"]).optional(),
};

// Schema for user creation
export const userCreateSchema = z.object({
  ...userBaseSchema,
  // Email is required for creation
  email: userBaseSchema.email,
  // Default role to USER if not specified
  role: userBaseSchema.role.default("USER"),
});

// Schema for user updates - all fields are optional
export const userUpdateSchema = z.object({
  ...Object.entries(userBaseSchema).reduce((acc, [key, validator]) => {
    // Make all fields optional
    acc[key] = validator.optional();
    return acc;
  }, {} as Record<string, z.ZodTypeAny>),
});

// Types derived from the user schemas
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// ==================== COMMENT SCHEMAS ====================

// Base schema with common fields for comment creation
export const commentBaseSchema = {
  text: z.string().min(1, "Comment text is required"),
};

// Schema for comment creation
export const commentCreateSchema = z.object({
  ...commentBaseSchema,
});

// Types derived from the comment schemas
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;

// ==================== NOTIFICATION SCHEMAS ====================

// Schema for notification creation
export const notificationCreateSchema = z.object({
  type: z.enum(["ISSUE_ASSIGNED", "COMMENT_ADDED", "STATUS_CHANGED"]),
  message: z.string().min(1, "Message is required"),
  userId: z.string().uuid(),
  issueId: z.string().uuid().optional(),
});

// Schema for notification update (mark as read)
export const notificationUpdateSchema = z.object({
  read: z.boolean(),
});

// Types derived from the notification schemas
export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;
export type NotificationUpdateInput = z.infer<typeof notificationUpdateSchema>; 