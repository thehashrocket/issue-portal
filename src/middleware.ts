import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Check if the user is authenticated for protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/api/protected");
  
  if (isProtectedRoute && !session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  return NextResponse.next();
}

// Configure which routes to apply the middleware to
export const config = {
  matcher: [
    "/api/protected/:path*",
  ],
}; 