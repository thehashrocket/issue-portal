import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { clientUpdateSchema } from "@/lib/validation";
import { ApiErrors, createSuccessResponse } from "@/lib/api-utils";
import { checkAuthorization } from "@/lib/auth-utils";
import { PrismaClient } from '@prisma/client';

// GET /api/clients/[id] - Get a specific client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  // Check authorization for viewing clients
  const authError = checkAuthorization(session, "client", "view");
  if (authError) return authError;
  
  try {
    const { id } = await params;
    const prismaTyped = prisma as PrismaClient;
    
    // Find the client
    const client = await prismaTyped.client.findUnique({
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  // Check authorization for updating clients
  const authError = checkAuthorization(session, "client", "update");
  if (authError) return authError;
  
  try {
    const { id } = await params;
    const body = await request.json();
    const prismaTyped = prisma as PrismaClient;
    
    // Validate request body
    const validationResult = clientUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiErrors.unprocessableEntity(
        "Validation failed",
        validationResult.error.format()
      );
    }
    
    // Check if client exists and user has permission
    const existingClient = await prismaTyped.client.findUnique({
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
    const updatedClient = await prismaTyped.client.update({
      where: { id },
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

// DELETE /api/clients/[id] - Soft delete a specific client
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  // Check authorization for deleting clients
  const authError = checkAuthorization(session, "client", "delete");
  if (authError) return authError;
  
  try {
    const { id } = await params;
    const prismaTyped = prisma as PrismaClient;
    
    // Check if client exists and user has permission
    const existingClient = await prismaTyped.client.findUnique({
      where: { id },
    });
    
    if (!existingClient) {
      return ApiErrors.notFound("Client");
    }
    
    // Check if user has permission to delete this client
    if (
      session?.user?.role !== "ADMIN" &&
      existingClient.managerId !== session?.user?.id
    ) {
      return ApiErrors.forbidden("You don't have permission to delete this client");
    }
    
    // Soft delete the client by setting status to INACTIVE
    await prismaTyped.client.update({
      where: { id },
      data: {
        status: "INACTIVE",
      },
    });

    return createSuccessResponse({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting client:", error);
    return ApiErrors.serverError("Failed to soft delete client");
  }
}

// PATCH /api/clients/[id] - Partially update a specific client
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  // Check authorization for updating clients
  const authError = checkAuthorization(session, "client", "update");
  if (authError) return authError;
  
  try {
    const { id } = await params;
    const body = await request.json();
    const prismaTyped = prisma as PrismaClient;
    
    // Validate request body
    const validationResult = clientUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return ApiErrors.unprocessableEntity(
        "Validation failed",
        validationResult.error.format()
      );
    }
    
    // Check if client exists and user has permission
    const existingClient = await prismaTyped.client.findUnique({
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
    
    // Update the client with only the fields that were provided
    const updateData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    // Update the client
    const updatedClient = await prismaTyped.client.update({
      where: { id },
      data: updateData,
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