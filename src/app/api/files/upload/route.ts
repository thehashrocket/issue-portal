import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { processFileUpload } from '@/lib/upload-middleware';
import { uploadFileToS3 } from '@/lib/s3';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for validating request body
const uploadSchema = z.object({
  issueId: z.string().uuid().optional(),
});

/**
 * POST handler for file uploads
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    
    // Process metadata
    const issueId = formData.get('issueId') as string | undefined;
    
    // Validate metadata
    try {
      uploadSchema.parse({ issueId });
    } catch {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Process file upload
    const file = await processFileUpload(formData);
    
    // Upload file to S3
    const { key, url } = await uploadFileToS3(file);
    
    // Save file metadata to database
    const fileRecord = await prisma.file.create({
      data: {
        filename: key,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key,
        url,
        uploadedById: session.user.id,
        ...(issueId ? { issueId } : {}),
      },
    });

    return NextResponse.json(fileRecord, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for checking upload status
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'File upload endpoint is ready' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking upload status:', error);
    return NextResponse.json(
      { error: 'Failed to check upload status' },
      { status: 500 }
    );
  }
} 