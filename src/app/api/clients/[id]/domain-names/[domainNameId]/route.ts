import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; domainNameId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id, domainNameId } = await params;
    await prisma.domainName.delete({
      where: {
        id: domainNameId,
        clientId: id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting domain name:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 