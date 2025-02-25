import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { clientUpdateSchema } from "@/lib/validation";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { checkAuthorization } from "@/lib/auth-utils";

// GET /api/clients/[id] - Get a specific client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  // Check authorization for viewing clients
  const authError = checkAuthorization(session, "client", "view");
  if (authError) return authError;
  
  try {
    const { id } = params;
    const prismaAny = prisma as any;
    
    // Find the client
    const client = await prismaAny.client.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!client) {
      return ApiErrors.notFound("Client");
    }
    
    // Check if user has permission to view this client
    if (
      session?.user?.role !== "ADMIN" &&
      client.managerId !== session?.user?.id
    ) {
      return ApiErrors.forbidden("You don't have permission to view this client");
    }
    
    return createSuccessResponse(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return ApiErrors.serverError("Failed to fetch client");
  }
}

// PUT /api/clients/[id] - Update a specific client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  // Check authorization for updating clients
  const authError = checkAuthorization(session, "client", "update");
  if (authError) return authError;
  
  try {
    const { id } = params;
    const body = await request.json();
    const prismaAny = prisma as any;
    
    // Validate request body
    const validationResult = clientUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiErrors.validationFailed(validationResult.error.format());
    }
    
    // Check if client exists and user has permission
    const existingClient = await prismaAny.client.findUnique({
      where: { id },
    });
    
    if (!existingClient) {
      return ApiErrors.notFound("Client");
    }
    
    // Check if user has permission to update this client
    if (
      session?.user?.role !== "ADMIN" &&
      existingClient.managerId !== session?.user?.id
    ) {
      return ApiErrors.forbidden("You don't have permission to update this client");
    }
    
    const data = validationResult.data;
    
    // Update the client
    const updatedClient = await prismaAny.client.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        website: data.website,
        description: data.description,
        status: data.status,
        managerId: data.managerId,
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
    });
    
    return createSuccessResponse(updatedClient, 200, "Client updated successfully");
  } catch (error) {
    console.error("Error updating client:", error);
    return ApiErrors.serverError("Failed to update client");
  }
}

// DELETE /api/clients/[id] - Delete a specific client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  // Check authorization for deleting clients
  const authError = checkAuthorization(session, "client", "delete");
  if (authError) return authError;
  
  try {
    const { id } = params;
    const prismaAny = prisma as any;
    
    // Check if client exists and user has permission
    const existingClient = await prismaAny.client.findUnique({
      where: { id },
    });
    
    if (!existingClient) {
      return ApiErrors.notFound("Client");
    }
    
    // Only ADMIN can delete clients
    // ACCOUNT_MANAGER can only mark clients as INACTIVE
    if (session?.user?.role !== "ADMIN") {
      return ApiErrors.forbidden("Only administrators can delete clients");
    }
    
    // Delete the client
    await prismaAny.client.delete({
      where: { id },
    });
    
    return createSuccessResponse({ id }, 200, "Client deleted successfully");
  } catch (error) {
    console.error("Error deleting client:", error);
    return ApiErrors.serverError("Failed to delete client");
  }
} 