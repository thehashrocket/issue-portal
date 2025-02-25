import { NextRequest } from 'next/server';

/**
 * Process a file upload from a FormData request
 * @param formData The FormData object from the request
 * @param fieldName The name of the field containing the file
 * @returns The uploaded file
 */
export async function processFileUpload(
  formData: FormData,
  fieldName: string = 'file'
): Promise<{
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}> {
  const file = formData.get(fieldName) as File;
  
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  // Check file size (10MB limit)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds the 10MB limit');
  }
  
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return {
    buffer,
    originalname: file.name,
    mimetype: file.type,
    size: file.size
  };
} 