import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const domainNames = await prisma.domainName.findMany({
      where: {
        clientId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: domainNames });
  } catch (error) {
    console.error('Error fetching domain names:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, hostingProvider, domainExpiration, domainName, domainStatus } = body;

    const newDomainName = await prisma.domainName.create({
      data: {
        name,
        hostingProvider,
        domainExpiration,
        domainName,
        domainStatus,
        clientId: id,
      },
    });

    return NextResponse.json({ data: newDomainName });
  } catch (error) {
    console.error('Error creating domain name:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { id: domainId, name, hostingProvider, domainExpiration, domainName, domainStatus } = body;

    const updatedDomainName = await prisma.domainName.update({
      where: {
        id: domainId,
        clientId: id,
      },
      data: {
        name,
        hostingProvider,
        domainExpiration,
        domainName,
        domainStatus,
      },
    });

    return NextResponse.json({ data: updatedDomainName });
  } catch (error) {
    console.error('Error updating domain name:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 