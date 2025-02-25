import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { clientCreateSchema } from "@/lib/validation";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { checkAuthorization } from "@/lib/auth-utils";

// GET /api/clients - Get all clients
export async function GET(request: NextRequest) {
  const session = await auth();
  
  // Check authorization for listing clients
  const authError = checkAuthorization(session, "client", "list");
  if (authError) return authError;
  
  try {
    let clients;
    const prismaAny = prisma as any;
    
    // If user is ADMIN, return all clients
    // If user is ACCOUNT_MANAGER, return only their clients
    if (session?.user?.role === "ADMIN") {
      clients = await prismaAny.client.findMany({
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } else {
      // For ACCOUNT_MANAGER, only return clients they manage
      clients = await prismaAny.client.findMany({
        where: {
          managerId: session?.user?.id,
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }
    
    return createSuccessResponse(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return ApiErrors.serverError("Failed to fetch clients");
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  const session = await auth();
  
  // Check authorization for creating clients
  const authError = checkAuthorization(session, "client", "create");
  if (authError) return authError;
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = clientCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiErrors.validationFailed(validationResult.error.format());
    }
    
    const data = validationResult.data;
    const prismaAny = prisma as any;
    
    // Create the client
    const client = await prismaAny.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        website: data.website,
        description: data.description,
        status: data.status || "ACTIVE",
        managerId: data.managerId || session?.user?.id, // Default to current user if not specified
      },
    });
    
    return createSuccessResponse(client, 201, "Client created successfully");
  } catch (error) {
    console.error("Error creating client:", error);
    return ApiErrors.serverError("Failed to create client");
  }
} 