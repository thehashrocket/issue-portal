import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;
  
  // Check if the route requires authentication
  const isProtectedRoute = pathname.startsWith("/api/protected");
  const isAdminRoute = pathname.startsWith("/api/users");
  
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
  
  return NextResponse.next();
}

// Configure which routes to apply the middleware to
export const config = {
  matcher: [
    "/api/protected/:path*",
    "/api/users/:path*",
  ],
}; 