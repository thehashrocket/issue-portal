import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  // Authentication and authorization are now handled by middleware
  // We can assume the user is authenticated and has admin role
  
  try {
    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return createSuccessResponse(users, 200, "Users retrieved successfully");
  } catch (error) {
    console.error("Error fetching users:", error);
    return ApiErrors.serverError("Failed to fetch users");
  }
} 