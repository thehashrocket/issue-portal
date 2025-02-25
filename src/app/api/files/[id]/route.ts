import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { deleteFileFromS3 } from '@/lib/s3';

/**
 * DELETE handler for deleting a file by ID
 * Only admins can delete files
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only admins can delete files' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Validate file ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    // Get the file to delete
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete file from S3
    await deleteFileFromS3(file.key);

    // Delete file record from database
    await prisma.file.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'File deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 