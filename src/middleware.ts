import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ApiErrors } from "@/lib/api-utils";
import { isAdmin, isAccountManager, checkAuthorization } from "@/lib/auth-utils";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;
  
  // Check if the route requires authentication
  const isProtectedRoute = pathname.startsWith("/api/protected");
  const isAdminRoute = pathname.startsWith("/api/users");
  const isClientRoute = pathname.startsWith("/api/clients");
  const isIssueRoute = pathname.startsWith("/api/issues");
  
  // Handle authentication for protected routes
  if (isProtectedRoute && (!session || !session.user)) {
    return ApiErrors.unauthorized();
  }
  
  // Handle authorization for admin-only routes
  if (isAdminRoute) {
    // First check authentication
    if (!session || !session.user) {
      return ApiErrors.unauthorized();
    }
    
    // Then check authorization (admin role)
    if (!isAdmin(session)) {
      return ApiErrors.forbidden("Forbidden: Admin access required");
    }
  }
  
  // Handle authorization for client routes (ADMIN and ACCOUNT_MANAGER only)
  if (isClientRoute) {
    // First check authentication
    if (!session || !session.user) {
      return ApiErrors.unauthorized();
    }
    
    // Then check authorization (ADMIN or ACCOUNT_MANAGER role)
    if (!isAdmin(session) && !isAccountManager(session)) {
      return ApiErrors.forbidden("Forbidden: Admin or Account Manager access required");
    }
  }
  
  // Handle authentication for issue routes
  if (isIssueRoute) {
    // Check authentication
    if (!session || !session.user) {
      return ApiErrors.unauthorized();
    }
    
    // Authorization for specific issue operations will be handled in the route handlers
  }
  
  return NextResponse.next();
}

// Configure which routes to apply the middleware to
export const config = {
  matcher: [
    "/api/protected/:path*",
    "/api/users/:path*",
    "/api/clients/:path*",
    "/api/issues/:path*",
  ],
}; 