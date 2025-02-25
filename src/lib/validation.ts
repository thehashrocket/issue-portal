import { z } from "zod";

/**
 * Shared validation schemas for the application
 */

// ==================== ISSUE SCHEMAS ====================

// Base schema with common fields for both creation and updates
export const issueBaseSchema = {
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  assignedToId: z.string().uuid().optional().nullable(),
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
  }, {} as Record<string, z.ZodType<any>>),
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
  }, {} as Record<string, z.ZodType<any>>),
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
  }, {} as Record<string, z.ZodType<any>>),
});

// Types derived from the user schemas
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>; 