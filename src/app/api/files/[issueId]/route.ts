import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET handler for retrieving files by issue ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { issueId: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { issueId } = params;

    // Validate issueId
    if (!issueId || typeof issueId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // Get files for the issue
    const files = await prisma.file.findMany({
      where: {
        issueId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error retrieving files:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve files' },
      { status: 500 }
    );
  }
} 