import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { clientCreateSchema } from "@/lib/validation";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { checkAuthorization } from "@/lib/auth-utils";
import { PrismaClient } from '@prisma/client';

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
    
    // Parse filter parameters
    const statusFilter = searchParams.get('status') || undefined;
    const searchTerm = searchParams.get('search') || undefined;
    
    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validPageSize = pageSize > 0 && pageSize <= 50 ? pageSize : 10;
    
    // Calculate skip value for pagination
    const skip = (validPage - 1) * validPageSize;
    
    // Build where clause for filtering
    const whereClause: any = {};
    
    // Add status filter if provided
    if (statusFilter) {
      whereClause.status = statusFilter;
    }
    
    // Add search term filter if provided
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    // If user is not ADMIN, only show their clients
    if (session?.user?.role !== "ADMIN") {
      whereClause.managerId = session?.user?.id;
    }
    
    let clients;
    let totalCount;
    const prismaTyped = prisma as PrismaClient;
    
    // Get total count for pagination with filters applied
    totalCount = await prismaTyped.client.count({
      where: whereClause,
    });
    
    // Get paginated clients with filters applied
    clients = await prismaTyped.client.findMany({
      where: whereClause,
      skip,
      take: validPageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        managerId: true,
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
    const prismaTyped = prisma as PrismaClient;
    
    // Create the client
    const client = await prismaTyped.client.create({
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