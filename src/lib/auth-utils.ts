import { Session } from "next-auth";
import { ApiErrors } from "./api-utils";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

/**
 * Types of resources that can be authorized
 */
export type ResourceType = "issue" | "client" | "user";

/**
 * Actions that can be performed on resources
 */
export type Action = "view" | "create" | "update" | "delete" | "list";

/**
 * Extended Session type with properly typed user role
 */
interface ExtendedSession extends Session {
  user: {
    id: string;
    role: Role;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * Check if a user has admin role
 */
export function isAdmin(session: Session | null): boolean {
  return !!session?.user?.role && session.user.role === ("ADMIN" as Role);
}

/**
 * Check if a user has account manager role
 */
export function isAccountManager(session: Session | null): boolean {
  return !!session?.user?.role && session.user.role === ("ACCOUNT_MANAGER" as Role);
}

/**
 * Check if a user is the owner of a resource
 */
export function isOwner(session: Session | null, ownerId: string): boolean {
  return !!session?.user?.id && session.user.id === ownerId;
}

/**
 * Check if a user is assigned to a resource
 */
export function isAssigned(session: Session | null, assignedToId: string | null): boolean {
  return !!session?.user?.id && !!assignedToId && session.user.id === assignedToId;
}

// Type definitions for resource data
type IssueViewData = { reportedById: string; assignedToId: string | null };
type IssueUpdateData = { reportedById: string; assignedToId: string | null };
type IssueDeleteData = { reportedById: string };
type UserUpdateData = { userId: string };

/**
 * Authorization rules for different resources and actions
 */
export const authorizationRules = {
  issue: {
    view: (session: Session | null, data: IssueViewData): boolean => {
      return isAdmin(session) || isOwner(session, data.reportedById) || isAssigned(session, data.assignedToId);
    },
    create: (session: Session | null): boolean => {
      // Any authenticated user can create an issue
      return !!session?.user;
    },
    update: (session: Session | null, data: IssueUpdateData): boolean => {
      return isAdmin(session) || isOwner(session, data.reportedById) || isAssigned(session, data.assignedToId);
    },
    delete: (session: Session | null, data: IssueDeleteData): boolean => {
      // Only admins and the reporter can delete an issue
      return isAdmin(session) || isOwner(session, data.reportedById);
    },
    list: (session: Session | null): boolean => {
      // Any authenticated user can list issues
      return !!session?.user;
    }
  },
  client: {
    view: (session: Session | null): boolean => {
      return isAdmin(session) || isAccountManager(session);
    },
    create: (session: Session | null): boolean => {
      return isAdmin(session) || isAccountManager(session);
    },
    update: (session: Session | null): boolean => {
      return isAdmin(session) || isAccountManager(session);
    },
    delete: (session: Session | null): boolean => {
      // Only admins can delete clients
      return isAdmin(session);
    },
    list: (session: Session | null): boolean => {
      return isAdmin(session) || isAccountManager(session);
    }
  },
  user: {
    view: (session: Session | null): boolean => {
      return isAdmin(session);
    },
    create: (session: Session | null): boolean => {
      return isAdmin(session);
    },
    update: (session: Session | null, data: UserUpdateData): boolean => {
      // Users can update their own profile, admins can update any user
      return isAdmin(session) || isOwner(session, data.userId);
    },
    delete: (session: Session | null): boolean => {
      // Only admins can delete users
      return isAdmin(session);
    },
    list: (session: Session | null): boolean => {
      return isAdmin(session);
    }
  }
};

/**
 * Check if a user is authorized to perform an action on a resource
 * @param session The user's session
 * @param resourceType The type of resource
 * @param action The action to perform
 * @param resourceData Additional data about the resource
 * @returns true if authorized, false otherwise
 */
export function isAuthorized(
  session: Session | null,
  resourceType: ResourceType,
  action: Action,
  resourceData: Record<string, any> = {}
): boolean {
  // If no session, user is not authorized
  if (!session || !session.user) {
    return false;
  }

  // Get the authorization rule for this resource and action
  const rule = authorizationRules[resourceType][action];
  
  // If no rule exists, deny by default
  if (!rule) {
    return false;
  }
  
  // Apply the rule with the resource data
  return rule(session, resourceData as any);
}

/**
 * Check authorization and return an error response if not authorized
 * @param session The user's session
 * @param resourceType The type of resource
 * @param action The action to perform
 * @param resourceData Additional data about the resource
 * @returns An error response if not authorized, null otherwise
 */
export function checkAuthorization(
  session: Session | null,
  resourceType: ResourceType,
  action: Action,
  resourceData: Record<string, any> = {}
): NextResponse | null {
  // First check if session exists
  if (!session || !session.user) {
    return ApiErrors.unauthorized();
  }
  
  // Then check authorization
  if (!isAuthorized(session, resourceType, action, resourceData)) {
    return ApiErrors.forbidden(`You don't have permission to ${action} this ${resourceType}`);
  }
  
  // If authorized, return null (no error)
  return null;
} 