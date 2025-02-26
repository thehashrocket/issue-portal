import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import { ApiErrors } from "@/lib/api-utils";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // Debug logging
  console.log('Middleware executing for:', pathname + search);
  
  // Get the token from the cookie - check all possible cookie names
  const sessionToken = 
    request.cookies.get("next-auth.session-token")?.value || 
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;  // Add this new format
  
  console.log('Cookie check:', {
    hasNextAuthToken: !!request.cookies.get("next-auth.session-token"),
    hasSecureNextAuthToken: !!request.cookies.get("__Secure-next-auth.session-token"),
    hasSecureAuthJsToken: !!request.cookies.get("__Secure-authjs.session-token"),
    allCookies: request.cookies.getAll().map(c => c.name)
  });
  
  // Check if the route requires authentication
  const isProtectedRoute = pathname.startsWith("/api/protected");
  const isAdminRoute = pathname.startsWith("/api/users");
  const isClientRoute = pathname.startsWith("/api/clients");
  const isIssueRoute = pathname.startsWith("/api/issues");
  
  // If this is an API route that requires authentication
  if ((isProtectedRoute || isAdminRoute || isClientRoute || isIssueRoute)) {
    if (!sessionToken) {
      console.log('No session token found for protected route:', pathname);
      console.log('Available cookies:', request.cookies.getAll().map(c => c.name).join(', '));
      
      // Return JSON response for API routes
      return new NextResponse(
        JSON.stringify({ 
          error: "Unauthorized",
          message: "You must be signed in to access this resource"
        }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
  
  return NextResponse.next();
}

// Configure which routes to apply the middleware to
export const config = {
  matcher: [
    // Only match API routes that need protection
    "/api/protected/:path*",
    "/api/users/:path*",
    "/api/clients/:path*",
    "/api/issues/:path*"
  ],
}; 