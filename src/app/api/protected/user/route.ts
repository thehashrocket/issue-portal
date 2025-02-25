import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";

export async function GET() {
  const session = await auth();
  
  // Authentication is now handled by middleware
  // We can assume session and session.user.id exist
  // Using non-null assertion since middleware guarantees session exists
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    
    if (!user) {
      return ApiErrors.notFound("User");
    }
    
    return createSuccessResponse(user, 200, "User profile retrieved successfully");
  } catch (error) {
    console.error("Error fetching user:", error);
    return ApiErrors.serverError("Failed to fetch user");
  }
} 