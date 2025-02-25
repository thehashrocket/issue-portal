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
    // Parse pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validPageSize = pageSize > 0 && pageSize <= 50 ? pageSize : 10;
    
    // Calculate skip value for pagination
    const skip = (validPage - 1) * validPageSize;
    
    let clients;
    let totalCount;
    const prismaAny = prisma as any;
    
    // If user is ADMIN, return all clients
    // If user is ACCOUNT_MANAGER, return only their clients
    if (session?.user?.role === "ADMIN") {
      // Get total count for pagination
      totalCount = await prismaAny.client.count();
      
      // Get paginated clients
      clients = await prismaAny.client.findMany({
        skip,
        take: validPageSize,
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
      // Get total count for pagination
      totalCount = await prismaAny.client.count({
        where: {
          managerId: session?.user?.id,
        },
      });
      
      // Get paginated clients
      clients = await prismaAny.client.findMany({
        where: {
          managerId: session?.user?.id,
        },
        skip,
        take: validPageSize,
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
    
    // Create response with pagination headers
    const response = NextResponse.json({ data: clients });
    
    // Add pagination headers
    response.headers.set('X-Total-Count', totalCount.toString());
    response.headers.set('X-Page', validPage.toString());
    response.headers.set('X-Page-Size', validPageSize.toString());
    response.headers.set('X-Total-Pages', Math.ceil(totalCount / validPageSize).toString());
    
    return response;
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
        primaryContact: data.primaryContact,
        sla: data.sla,
        notes: data.notes,
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