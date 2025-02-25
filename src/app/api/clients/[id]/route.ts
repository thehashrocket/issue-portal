import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema for client update validation
const clientUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "LEAD", "FORMER"]).optional(),
  managerId: z.string().uuid().optional().nullable(),
});

// GET /api/clients/[id] - Get a specific client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
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
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    
    // Check if user has permission to view this client
    if (
      session.user.role !== "ADMIN" &&
      client.managerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't have permission to view this client" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { id } = params;
    const body = await request.json();
    const prismaAny = prisma as any;
    
    // Validate request body
    const validationResult = clientUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    // Check if client exists and user has permission
    const existingClient = await prismaAny.client.findUnique({
      where: { id },
    });
    
    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    
    // Check if user has permission to update this client
    if (
      session.user.role !== "ADMIN" &&
      existingClient.managerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't have permission to update this client" },
        { status: 403 }
      );
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
    
    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { id } = params;
    const prismaAny = prisma as any;
    
    // Check if client exists and user has permission
    const existingClient = await prismaAny.client.findUnique({
      where: { id },
    });
    
    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    
    // Only ADMIN can delete clients
    // ACCOUNT_MANAGER can only mark clients as INACTIVE
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can delete clients" },
        { status: 403 }
      );
    }
    
    // Delete the client
    await prismaAny.client.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: "Client deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
} 