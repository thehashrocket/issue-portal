import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;
  
  // Check if the route requires authentication
  const isProtectedRoute = pathname.startsWith("/api/protected");
  const isAdminRoute = pathname.startsWith("/api/users");
  const isClientRoute = pathname.startsWith("/api/clients");
  
  // Handle authentication for protected routes
  if (isProtectedRoute && (!session || !session.user)) {
    return NextResponse.json(
      { error: "Unauthorized: Authentication required" },
      { status: 401 }
    );
  }
  
  // Handle authorization for admin-only routes
  if (isAdminRoute) {
    // First check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }
    
    // Then check authorization (admin role)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }
  }
  
  // Handle authorization for client routes (ADMIN and ACCOUNT_MANAGER only)
  if (isClientRoute) {
    // First check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }
    
    // Then check authorization (ADMIN or ACCOUNT_MANAGER role)
    const userRole = session.user.role as string;
    if (userRole !== "ADMIN" && userRole !== "ACCOUNT_MANAGER") {
      return NextResponse.json(
        { error: "Forbidden: Admin or Account Manager access required" },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}

// Configure which routes to apply the middleware to
export const config = {
  matcher: [
    "/api/protected/:path*",
    "/api/users/:path*",
    "/api/clients/:path*",
  ],
}; 