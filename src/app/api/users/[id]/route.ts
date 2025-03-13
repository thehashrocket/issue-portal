import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { checkAuthorization } from "@/lib/auth-utils";

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  // Check authorization for viewing users
  const authError = checkAuthorization(session, "user", "view");
  if (authError) return authError;
  
  try {
    const { id } = await params;
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      return ApiErrors.notFound("User");
    }
    
    return createSuccessResponse(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return ApiErrors.serverError("Failed to fetch user");
  }
} 